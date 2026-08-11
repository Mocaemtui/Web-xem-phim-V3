declare module 'opensubtitles-api' {
  interface OpenSubtitlesAPI {
    search(options: {
      imdbid?: string;
      query?: string;
      season?: number;
      episode?: number;
      sublanguageid?: string;
    }): Promise<any>;
  }

  interface OpenSubtitlesConstructor {
    new (apiKey: string): OpenSubtitlesAPI;
  }

  const OpenSubtitles: OpenSubtitlesConstructor;
  export default OpenSubtitles;
}
