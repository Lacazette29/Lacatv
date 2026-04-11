import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";

const API_KEY  = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

const HEADERS = {
  "x-rapidapi-key":  API_KEY,
  "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
};

async function fetchFromSupabase() {
  const { data } = await supabase
    .from("live_scores")
    .select("*")
    .order("match_date", { ascending: true });
  return (data || []).map(supabaseToScore);
}

async function syncToSupabase(scores) {
  for (const score of scores) {
    await supabase.from("live_scores").upsert(
      {
        id:           score.id,
        league:       score.league,
        home_team:    score.home_team,
        away_team:    score.away_team,
        home_score:   score.home_score,
        away_score:   score.away_score,
        minute:       score.minute,
        status:       score.status,
        match_date:   score.match_date,
        home_scorers: score.home_scorers,
        away_scorers: score.away_scorers,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  }
}

async function fetchTodayFromAPI() {
  const today = new Date().toISOString().split("T")[0];
  const res   = await fetch(`${BASE_URL}/fixtures?date=${today}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json  = await res.json();
  return (json.response || []).map(normaliseFixture);
}

async function fetchLiveFromAPI() {
  const res  = await fetch(`${BASE_URL}/fixtures?live=all`, { headers: HEADERS });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return (json.response || []).map(normaliseFixture);
}

export function useFootballScores() {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    try {
      // Try live fixtures first
      let fixtures = await fetchLiveFromAPI();

      // If no live games, get today's full schedule
      if (fixtures.length === 0) {
        fixtures = await fetchTodayFromAPI();
      }

      if (fixtures.length > 0) {
        await syncToSupabase(fixtures);
        setScores(fixtures);
      } else {
        // Fall back to whatever is in Supabase
        const fallback = await fetchFromSupabase();
        setScores(fallback);
      }

      setError(null);
    } catch (err) {
      console.error("Football API error:", err.message);
      setError(err.message);
      // Always fall back to Supabase on error
      const fallback = await fetchFromSupabase();
      setScores(fallback);
    } finally {
      setLoading(false);
    }
  }, []); // No external dependencies — all helpers are module-level functions

  useEffect(() => {
    refresh();
    // Refresh every 60s (stays within 100 req/day free tier)
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { scores, loading, error, refetch: refresh };
}

// ── Helpers ──────────────────────────────────────
function normaliseFixture(f) {
  const status = getStatus(f.fixture.status.short);
  const minute = f.fixture.status.elapsed || 0;

  const homeScorers = (f.events || [])
    .filter(e => e.type === "Goal" && e.team.id === f.teams.home.id)
    .map(e => `${e.player.name} ${e.time.elapsed}'`);

  const awayScorers = (f.events || [])
    .filter(e => e.type === "Goal" && e.team.id === f.teams.away.id)
    .map(e => `${e.player.name} ${e.time.elapsed}'`);

  return {
    id:           String(f.fixture.id),
    league:       f.league.name,
    home_team:    f.teams.home.name,
    away_team:    f.teams.away.name,
    home_score:   f.goals.home  || 0,
    away_score:   f.goals.away  || 0,
    minute,
    status,
    match_date:   f.fixture.date,
    home_scorers: homeScorers,
    away_scorers: awayScorers,
  };
}

function getStatus(short) {
  if (["1H","HT","2H","ET","BT","P","LIVE"].includes(short)) return "live";
  if (["FT","AET","PEN"].includes(short))                    return "ft";
  return "upcoming";
}

function supabaseToScore(row) {
  return {
    id:           row.id,
    league:       row.league,
    home_team:    row.home_team,
    away_team:    row.away_team,
    home_score:   row.home_score,
    away_score:   row.away_score,
    minute:       row.minute,
    status:       row.status,
    match_date:   row.match_date,
    home_scorers: row.home_scorers || [],
    away_scorers: row.away_scorers || [],
  };
}
