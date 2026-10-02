/**
 * Keeps a page usable when an island fails while running: React would
 * otherwise remove the island's content and leave a blank space, so the
 * page shows what was built in its place.
 */
import {Component, type ReactNode} from 'react';

export class Fallback extends Component<{built: ReactNode; children: ReactNode}, {failed: boolean}> {
  state = {failed: false};

  static getDerivedStateFromError(): {failed: boolean} {
    return {failed: true};
  }

  render(): ReactNode {
    return this.state.failed ? this.props.built : this.props.children;
  }
}
