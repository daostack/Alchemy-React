import { IProposalState } from "@daostack/client";

import * as classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";
import { fromWei } from "lib/util";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryStandardBounties extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { proposal, detailView, genericSchemeInfo, transactionModal } = this.props;
    let decodedCallData: any;
    try {
      decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch(err) {
      if (err.message.match(/no action matching/gi)) {
        return <div>Error: {err.message} </div>;
      } else {
        throw err;
      }
    }
    const action = decodedCallData.action;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    switch (action.id) {
      case "issueAndContribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                Bounty Details: <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>. <br/>
                Deadline: {(new Date(parseInt(decodedCallData.values[4], 10)*1000)).toString()}. <br />
                Amount funded: {fromWei(decodedCallData.values[7].dividedBy('1e+9'))} {decodedCallData.values[6].toString() === '0' ?  'ETH'  : 'tokens'}. <br />
                Token Address: <a href={linkToEtherScan(decodedCallData.values[5])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[5]}</a> <br />
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br />
                Issuer: <a href={linkToEtherScan(decodedCallData.values[1])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[1]}</a> <br />
                Approver: <a href={linkToEtherScan(decodedCallData.values[2])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[2]}</a> 
              </div>
              : ""
            }
          </div>
        );
      case "contribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Contribution Amount: {fromWei(decodedCallData.values[2].dividedBy('1e+9'))} <br />
                Bounty ID: {decodedCallData.values[1]} <br />
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "refundContributions":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Refund for contribution IDs: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>  <br />
                Bounty ID: {decodedCallData.values[1]} <br />
                Issuer ID: {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "drainBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Draining {fromWei(decodedCallData.values[3].dividedBy('1e+9'))} amount of tokens for bounty ID {decodedCallData.values[1]}. <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "acceptFulfillment":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Accepting submission ID {decodedCallData.values[2]} for bounty ID {decodedCallData.values[1]} of {fromWei(decodedCallData.values[4].dividedBy('1e+9'))} tokens. <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Approver ID: {decodedCallData.values[3]}
              </div>
              : ""
            }
          </div>
        );
      case "changeBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                For Bounty ID {decodedCallData.values[1]}, <br/>
                Change issuers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
                Change approvers to: {decodedCallData.values[4].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
                Change bounty details to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[5]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[5]}</a><br/>
                Change bounty deadline to {(new Date(parseInt(decodedCallData.values[6], 10)*1000)).toString()} <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "changeData":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change details of bounty ID  {decodedCallData.values[1]} to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>. <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "changeDeadline":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change deadline of bounty ID {decodedCallData.values[1]} to {(new Date(parseInt(decodedCallData.values[3], 10)*1000)).toString()} <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "fulfillAndAccept":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                Accept submission of {decodedCallData.values[2].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br /> 
                and send {fromWei(decodedCallData.values[5].dividedBy('1e+9'))} tokens for bounty ID {decodedCallData.values[1]}. <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Approver ID: {decodedCallData.values[4]} <br/>
                Bounty Details: <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>
              </ul>
              : ""
            }
          </div>
        );
      case "replaceApprovers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change approvers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })} <br/> 
                Bounty ID: {decodedCallData.values[1]} <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]} <br/>
              </div>
              : ""
            }
          </div>
        );
      case "replaceIssuers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp; {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change issuers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })} <br />
                Bounty ID: {decodedCallData.values[1]} <br/>
                Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a> <br/>
                Issuer ID: {decodedCallData.values[2]} <br/>
              </div>
              : ""
            }
          </div>
        );
      default:
        return "";
    }
  }
}
