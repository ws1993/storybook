import type { Dispatch } from 'react';

import type { Action, State } from '../steps';

export type Procedure = {
  state: State;
  dispatch: Dispatch<Action>;
  onComplete: (errors?: Error[]) => void;
};
