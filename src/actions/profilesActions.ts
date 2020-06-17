import Box = require("3box");

import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getWeb3Provider } from "arc";
import Analytics from "lib/analytics";

import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, FollowType, newProfile } from "reducers/profilesReducer";
import { arrayRemove } from "lib/util";
import { Address } from "@daostack/arc.js";
import { settings } from "../settings";

// Load account profile data from our database for all the "members" of the DAO
// TODO: use this once 3box fixes getProfiles
export function getProfilesForAddresses(addresses: string[]) {
  return async (dispatch: any) => {
    try {
      const results = await Box.getProfiles(addresses);
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Success,
        payload: { profiles: results.data },
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.message,
      });
    }
  };
}

interface IThreeBoxInfo {
  threeBox: any;
  threeBoxSpace: any;
}

export async function createAdminSpace(currentAccount: Address) {
  if (currentAccount === settings["3BoxCommentsAdmin"]) {
    const web3Provider = getWeb3Provider();
    const box = await Box.openBox(settings["3BoxCommentsAdmin"], web3Provider);
    await box.syncDone;
    const space = await box.openSpace("DAOstack");
    await space.syncDone;
  }
}

/**
 * Returns an authorized 3Box instance and 3BoxSpace, ensures that the
 * account's 3Box space exists, and all account-specific data has
 * been fetched.  Updates state if needed.
 *
 * Caller is expected to handle exceptions.
 *
 * @param accountAddress
 */
async function get3Box(accountAddress: Address, dispatch: any, state: any): Promise<IThreeBoxInfo> {
  let box;
  let space;
  let updateState = false;
  const spaceName = "DAOstack";

  if (state.profiles.threeBox) {
    box = state.profiles.threeBox;
  } else {
    const web3Provider = getWeb3Provider();

    box = await Box.create(web3Provider);
    await box.auth([spaceName], { accountAddress });
    await box.syncDone;
    updateState = true;
  }
  /**
   * this ensures that a space for the account exists
   */
  if (state.profiles.threeBoxSpace) {
    space = state.profiles.threeBoxSpace;
  }
  else {
    /**
     * It is assumed here that the 3box admin space has already been created
     */
    space = await box.openSpace(spaceName);
    await space.syncDone;
    updateState = true;
  }

  const result = {
    threeBox: box,
    threeBoxSpace: space,
  };

  if (updateState) {
    dispatch({
      type: ActionTypes.SAVE_THREEBOX,
      sequence: AsyncActionSequence.Success,
      payload: result,
    });
  }

  return result;
}

export function getProfile(accountAddress: string, currentAccount = false) {
  return async (dispatch: any) => {
    try {
      // Get profile data for this account
      const profile: any = await Box.getProfile(accountAddress);

      if (profile) {
        profile.ethereumAccountAddress = accountAddress;
        profile.socialURLs = await Box.getVerifiedAccounts(profile);
        const space = await Box.getSpace(accountAddress, "DAOstack");
        await space.syncDone;

        if (space.follows) {
          profile.follows = space.follows;
        } else {
          profile.follows = {
            daos: [],
            proposals: [],
            schemes: [],
            users: [],
          };
        }

        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: { [accountAddress]: profile } },
        });

        if (currentAccount) {
          // If getting profile for the current account then update our analytics services with the profile data
          Analytics.people.set({
            Name: profile.name,
            Description: profile.description,
          });
        }
      } else {
        // Setup blank profile for the account
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: { [accountAddress]: newProfile(accountAddress) } },
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error getting profile from 3box (${e.message})`);
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.message,
      });
    }
  };
}

export function threeboxLogin(accountAddress: string): (dispatch: any, _getState: any) => Promise<boolean> {
  return async (dispatch: any, _getState: any) => {
    const state = _getState();

    try {
      if (state.profiles.threeBox) {
        return true;
      } else {
        await get3Box(accountAddress, dispatch, state);
      }
    } catch (e) {
      const errorMsg = e.message;

      // eslint-disable-next-line no-console
      console.error("Error logging in to 3box: ", errorMsg);

      dispatch(showNotification(NotificationStatus.Failure, `Logging in to 3box failed: ${errorMsg}`));
      return false;
    }

    dispatch(showNotification(NotificationStatus.Success, "Logged in to 3box"));
    return true;
  };
}

export function threeBoxLogout(): (dispatch: any, _getState: any) => Promise<void> {
  return async (dispatch: any, _getState: any) => {
    const state = _getState();
    if (state.profiles.threeBox) {
      state.profiles.threeBox.logout();
      dispatch({
        type: ActionTypes.SAVE_THREEBOX,
        sequence: AsyncActionSequence.Success,
        payload: { threeBox: null, threeBoxSpace: null },
      });
    }
  };
}

export type UpdateProfileAction = IAsyncAction<"UPDATE_PROFILE", { accountAddress: string }, { description: string; name: string; socialURLs?: any }>;

export function updateProfile(accountAddress: string, name: string, description: string): (dispatch: any, _getState: any) => Promise<boolean> {
  return async (dispatch: any, _getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    let threeBox;

    try {
      threeBox = (await get3Box(accountAddress, dispatch, _getState())).threeBox;
      await threeBox.public.setMultiple(["name", "description"], [name, description]);
    } catch (e) {
      const errorMsg = e.message;

      // eslint-disable-next-line no-console
      console.error("Error saving profile to 3box: ", errorMsg);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile to 3box failed: ${errorMsg}`));
      return false;
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description, threeBox },
    } as UpdateProfileAction);

    Analytics.track("Update Profile", {
      Name: name,
      Description: description,
    });

    Analytics.people.set({
      Name: name,
      Description: description,
    });

    dispatch(showNotification(NotificationStatus.Success, "Profile data saved to 3box"));
    return true;
  };
}

export type FollowItemAction = IAsyncAction<"FOLLOW_ITEM", { accountAddress: string }, { type: FollowType; id: string; isFollowing: boolean}>;

export function toggleFollow(accountAddress: string, type: FollowType, id: string) {
  return async (dispatch: any, _getState: any) => {
    const state = _getState();
    let threeBox;
    let threeBoxSpace;

    try {
      const threeBoxInfo = await get3Box(accountAddress, dispatch, state);
      threeBox = threeBoxInfo.threeBox;
      threeBoxSpace = threeBoxInfo.threeBoxSpace;
    } catch (e) {
      dispatch(showNotification(NotificationStatus.Failure, `Failed to connect to 3box: ${e.message}`));
      return false;
    }

    let follows = await threeBoxSpace.public.get("follows");
    if (!follows) {
      follows = {
        daos: [],
        proposals: [],
        users: [],
      };
    }
    if (!follows[type]) {
      follows[type] = [];
    }

    let isFollowing = true;

    if (follows[type].includes(id)) {
      follows[type] = arrayRemove(follows[type], id);
      isFollowing = false;
    } else {
      follows[type].push(id);
    }

    // TODO: check success?
    await threeBoxSpace.public.set("follows", follows);

    dispatch({
      type: ActionTypes.FOLLOW_ITEM,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { type, id, isFollowing, threeBox, threeBoxSpace },
    } as FollowItemAction);

    dispatch(showNotification(NotificationStatus.Success, (isFollowing ? "Now following" : "No longer following") + ` ${type.slice(0, -1)} ${id.slice(0, 8)}...`));
  };
}
