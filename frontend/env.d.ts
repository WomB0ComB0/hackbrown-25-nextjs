declare global { 
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SPOTIFY_CLIENT_ID: string;
      NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET: string;
      NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN: string;
      MONGODB_URI: string;
      NEXT_PUBLIC_PINECONE_API_KEY: string;
      NEXT_PUBLIC_OPENAI_API_KEY: string;
    }
  }
}

export { }