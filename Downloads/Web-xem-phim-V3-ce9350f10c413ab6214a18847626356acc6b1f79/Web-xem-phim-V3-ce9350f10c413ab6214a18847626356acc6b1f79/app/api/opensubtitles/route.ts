import { NextRequest, NextResponse } from "next/server";
import OpenSubtitles from 'opensubtitles-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imdbId = searchParams.get("imdbId");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!imdbId) {
    return NextResponse.json({ error: "Missing imdbId" }, { status: 400 });
  }

  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenSubtitles API Key not configured" }, { status: 500 });
  }

  try {
    const OpenSubtitlesAPI = new OpenSubtitles(apiKey);
    
    let subtitles: any[] = [];
    
    if (season && episode) {
      // TV Show
      const data = await OpenSubtitlesAPI.search({
        imdbid: imdbId,
        season: parseInt(season),
        episode: parseInt(episode),
        sublanguageid: 'vie,vie,en' // Vietnamese and English
      });
      subtitles = data.en || data.vie || [];
    } else {
      // Movie
      const data = await OpenSubtitlesAPI.search({
        imdbid: imdbId,
        sublanguageid: 'vie,vie,en' // Vietnamese and English
      });
      subtitles = data.en || data.vie || [];
    }

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json({ subtitles: [] });
    }

    // Filter and format subtitles
    const formattedSubs = subtitles
      .slice(0, 3) // Limit to 3 subtitles
      .map((sub: any) => ({
        file: sub.download,
        label: sub.lang || 'Unknown',
        kind: "captions"
      }));

    return NextResponse.json({ subtitles: formattedSubs }, {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    console.error("OpenSubtitles Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
