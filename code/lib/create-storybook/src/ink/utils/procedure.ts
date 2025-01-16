import type { Dispatch } from 'react';

import type { Action, State } from '../Main';

export type Procedure = {
  state: State;
  dispatch: Dispatch<Action>;
  onComplete: (errors?: Error[]) => void;
  doCancel: () => void;
};
