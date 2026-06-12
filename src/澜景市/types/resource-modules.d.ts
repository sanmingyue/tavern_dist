declare module '*.yaml' {
  const value: unknown;
  export default value;
}

declare module '*.yml' {
  const value: unknown;
  export default value;
}

declare module '*.txt' {
  const value: string;
  export default value;
}
