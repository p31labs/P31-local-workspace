declare module '*.astro' {
  const Component: any;
  export default Component;
  export type Props = Record<string, any>;
}
