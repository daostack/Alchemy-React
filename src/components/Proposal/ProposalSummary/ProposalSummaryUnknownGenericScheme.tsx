import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan, formatTokens } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {
    const { proposal, detailView, transactionModal } = this.props;
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.summaryTitle}>Unknown function call</span>
        {detailView ?
          <div className={css.summaryDetails}>
            on contract at:
            <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
            and send to contract:
            <pre className={proposal.genericScheme.value.isZero() ? "" : css.warning}>{formatTokens(proposal.genericScheme.value)} ETH</pre>
          </div>
          : ""
        }
      </div>
    );
  }
}
