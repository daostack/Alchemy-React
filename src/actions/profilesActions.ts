import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getWeb3Provider } from "arc";
//import axios from "axios";

import Box = require("3box");
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, FollowType, newProfile } from "reducers/profilesReducer";
import { arrayRemove } from "lib/util";

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
        payload: e.toString(),
      });
    }
  };
}

export function getProfile(accountAddress: string) {
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
        payload: e.toString(),
      });
    }
  };
}

export type UpdateProfileAction = IAsyncAction<"UPDATE_PROFILE", { accountAddress: string }, { description: string; name: string; socialURLs?: any }>;

export function updateProfile(accountAddress: string, name: string, description: string) {
  return async (dispatch: any, _getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    const state = _getState();
    let box;

    try {
      if (state.threeBox) {
        box = state.threeBox;
      } else {
        const web3Provider = await getWeb3Provider();
        box = await Box.openBox(accountAddress, web3Provider);
      }
      await box.syncDone;
      await box.public.setMultiple(["name", "description"], [name, description]);
    } catch (e) {
      const errorMsg = e.toString();

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
      payload: { name, description, threeBox: box },
    } as UpdateProfileAction);

    dispatch(showNotification(NotificationStatus.Success, "Profile data saved to 3box"));
    return true;
  };
}

export type FollowItemAction = IAsyncAction<"FOLLOW_ITEM", { accountAddress: string }, { type: FollowType; id: string; isFollowing: boolean}>;

export function toggleFollow(accountAddress: string, type: FollowType, id: string) {
  return async (dispatch: any, _getState: any) => {
    const web3Provider = await getWeb3Provider();
    const box = await Box.openBox(accountAddress, web3Provider);
    await box.syncDone;
    const space = await box.openSpace("DAOstack") ;
    await space.syncDone;
    let follows = await space.public.get("follows");

    if (!follows) {
      follows = {
        daos: [],
        proposals: [],
        schemes: [],
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
      console.log("remove", follows);
    } else {
      follows[type].push(id);
      console.log("adding follow", follows);
    }

    // TODO: check success?
    await space.public.set("follows", follows);

    dispatch({
      type: ActionTypes.FOLLOW_ITEM,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { type, id, isFollowing },
    } as FollowItemAction);

    dispatch(showNotification(NotificationStatus.Success, (isFollowing ? "Now following" : "No longer following") + ` ${type} ${id}`));
  };
}
