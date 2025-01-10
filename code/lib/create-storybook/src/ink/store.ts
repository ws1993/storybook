import { create } from 'zustand';

export const useStore = create<{
  renderers: string[];
  toggleRenderer: (renderer: string) => void;
  features: string[];
  toggleFeature: (feature: string) => void;
}>((set) => ({
  renderers: ['react'],
  toggleRenderer: (renderer) =>
    set((state) => ({
      renderers: state.renderers.includes(renderer)
        ? state.renderers.filter((r) => r !== renderer)
        : state.renderers.concat(renderer),
    })),

  features: ['ct', 'a11y'],
  toggleFeature: (feature) =>
    set((state) => ({
      features: state.features.includes(feature)
        ? state.features.filter((r) => r !== feature)
        : state.features.concat(feature),
    })),
}));
