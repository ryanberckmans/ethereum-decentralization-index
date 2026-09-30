import { assessment, composeAssessments } from 'ethereum-decentralization-index';
import { DecentralizationProvider, DecentralizationCard, DecentralizationPath, DecentralizationLegend } from 'ethereum-decentralization-index/react';
import 'ethereum-decentralization-index/styles.css';
// Illustrative reviewed inputs, not a live rating oracle. Supply your own dated,
// deployment-specific control reviews and keep wallet custody separate.
const asset = assessment(0), network = assessment(6), app = assessment(null, { unresolved: ['Application deployment'] });
const position = composeAssessments([asset, network, app]);
export default function WalletPosition() {
    return <DecentralizationProvider theme="dark">
 <DecentralizationCard title="ETH position on Base" value={position}>
  <DecentralizationPath items={[{ id: 'asset', label: 'Native ETH', value: asset }, { id: 'network', label: 'Base', value: network }, { id: 'app', label: 'Application deployment', value: app }]}/>
 </DecentralizationCard>
 <div style={{ marginTop: 32 }}><DecentralizationLegend /></div>
    </DecentralizationProvider>;
}
