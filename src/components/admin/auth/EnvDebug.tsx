export function EnvDebug() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: "10px", border: "2px solid blue", marginBottom: "20px", fontSize: "12px" }}>
      <h3 style={{ color: "blue", marginBottom: "10px" }}>🔍 Debug zmiennych środowiskowych:</h3>
      <div>
        <strong>PUBLIC_SUPABASE_URL:</strong>{" "}
        <span style={{ color: url ? "green" : "red" }}>
          {url ? `✓ Załadowany (${url.substring(0, 30)}...)` : "✗ BRAK"}
        </span>
      </div>
      <div>
        <strong>PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
        <span style={{ color: key ? "green" : "red" }}>
          {key ? `✓ Załadowany (${key.substring(0, 20)}...)` : "✗ BRAK"}
        </span>
      </div>
      <hr style={{ margin: "10px 0" }} />
      <small>Jeśli widzisz "✗ BRAK", sprawdź .env i zrestartuj serwer</small>
    </div>
  );
}
