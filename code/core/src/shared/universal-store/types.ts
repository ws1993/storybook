import type { Channel } from '@storybook/core/channels';

import type { UniversalStore } from '.';

export type EnvironmentType =
  (typeof UniversalStore.Environment)[keyof typeof UniversalStore.Environment];

export type StateUpdater<TState> = (prevState: TState) => TState;
export type Actor = {
  id: string;
  type: (typeof UniversalStore.ActorType)[keyof typeof UniversalStore.ActorType];
};
export type EventInfo = {
  actor: Actor;
};

export type Listener<TEvent> = (event: TEvent, eventInfo: EventInfo) => void;

export type SetStateEvent<TState> = {
  type: typeof UniversalStore.InternalEventTypes.SET_STATE;
  payload: {
    state: TState;
    previousState: TState;
  };
};
export type ExistingStateRequestEvent = {
  type: typeof UniversalStore.InternalEventTypes.EXISTING_STATE_REQUEST;
};
export type ExistingStateResponseEvent<TState> = {
  type: typeof UniversalStore.InternalEventTypes.EXISTING_STATE_RESPONSE;
  payload: TState;
};
export type InternalEvent<TState> =
  | SetStateEvent<TState>
  | ExistingStateRequestEvent
  | ExistingStateResponseEvent<TState>;
export type Event<TState, TEvent> = TEvent | InternalEvent<TState>;

export type ChannelLike = Pick<Channel, 'on' | 'off' | 'emit'>;

export type StoreOptions<TState> = {
  id: string;
  leader?: boolean;
  // TODO: Make leader required when initialState is set
  initialState?: TState;
  validateStateChange?: (event: {
    payload: TState;
    previousState: TState;
  }) => { message: string } | void | undefined;
};
