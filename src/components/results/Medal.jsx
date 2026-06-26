export default function Medal({ rank }) {
  if (rank === 1) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #FFE066, #FFD700, #B8860B)", color: "#5a3e00", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>1</span>
  );
  if (rank === 2) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #f0f0f0, #C0C0C0, #888)", color: "#333", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>2</span>
  );
  if (rank === 3) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #e8b07a, #CD7F32, #8B5A1A)", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>3</span>
  );
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, color: "#B8B0A8", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{rank}</span>;
}
