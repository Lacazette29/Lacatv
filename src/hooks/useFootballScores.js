import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";

const API_KEY  = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

// League IDs on API-Football
const LEAGUE_IDS = {
  "Premier League":   39,
  "La Liga":          140,
  "Champions League": 2,
  "Bundesliga":       78,
  "Serie A":          135,
  "Ligue 1":          61,
  "Europa League":    3,
  "NPFL":             332,
  "AFCON":            6,
};

export function useFootballScores() {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchLiveScores = useCallback(async () => {
    try {
      // Fetch all live fixtures from API-Football
      const res = await fetch(`${BASE_URL}/fixtures?live=all`, {
        headers: {
          "x-rapidapi-key":  API_KEY,
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      const fixtures = json.response || [];

      if (fixtures.length === 0) {
        // No live games right now — fetch today's fixtures instead
        await fetchTodayFixtures();
        return;
      }

      // Normalise and sync to Supabase
      const normalised = fixtures.map(normaliseFixture);
      await syncToSupabase(normalised);
      setScores(normalised);

    } catch (err) {
      console.error("Football API error:", err);
      setError(err.message);
      // Fall back to Supabase data
      await fetchFromSupabase();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayFixtures = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${BASE_URL}/fixtures?date=${today}`, {
        headers: {
          "x-rapidapi-key":  API_KEY,
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      });
      const json = await res.json();
      const fixtures = (json.response || [])
        .filter(f => Object.values(LEAGUE_IDS).includes(f.league.id));

      const normalised = fixtures.map(normaliseFixture);
      await syncToSupabase(normalised);
      setScores(normalised);
    } catch (err) {
      await fetchFromSupabase();
    }
  };

  const fetchFromSupabase = async () => {
    const { data } = await supabase
      .from("live_scores")
      .select("*")
      .order("match_date", { ascending: true });
    if (data) setScores(data.map(supabaseToScore));
  };

  // Sync API data to Supabase so realtime works across all clients
  const syncToSupabase = async (scores) => {
    for (const score of scores) {
      await supabase
        .from("live_scores")
        .upsert({
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
        }, { onConflict: "id" });
    }
  };

  useEffect(() => {
    fetchLiveScores();
    // Refresh every 60 seconds (API free tier: 100 req/day)
    const interval = setInterval(fetchLiveScores, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveScores]);

  return { scores, loading, error, refetch: fetchLiveScores };
}

// ── Normalise API-Football fixture → our shape ──
function normaliseFixture(f) {
  const status = getStatus(f.fixture.status.short);
  const minute = f.fixture.status.elapsed || 0;

  // Extract goalscorers
  const homeScorers = (f.events || [])
    .filter(e => e.type === "Goal" && e.team.id === f.teams.home.id)
    .map(e => `${e.player.name} ${e.time.elapsed}'`);

  const awayScorers = (f.events || [])
    .filter(e => e.type === "Goal" && e.team.id === f.teams.away.id)
    .map(e => `${e.player.name} ${e.time.elapsed}'`);

  return {
    id:           f.fixture.id.toString(),
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
  if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short))                          return "ft";
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
