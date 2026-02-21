declare module 'chrome-remote-interface' {
  interface CDPOptions {
    target?: string;
    port?: number;
    host?: string;
  }

  interface Client {
    close(): Promise<void>;
    Page: any;
    Runtime: any;
    Input: any;
    Network: any;
    DOM: any;
    CSS: any;
    Emulation: any;
    Performance: any;
    Accessibility: any;
    Animation: any;
    Overlay: any;
    Fetch: any;
    HeapProfiler: any;
    Profiler: any;
    Target: any;
    [key: string]: any;
  }

  function CDP(options?: CDPOptions): Promise<Client>;

  namespace CDP {
    function New(options?: { port?: number; host?: string; url?: string }): Promise<{ id: string; [key: string]: any }>;
    function Close(options?: { port?: number; host?: string; id?: string }): Promise<void>;
  }

  export = CDP;
}
