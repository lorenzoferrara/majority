export default function SignInForm({
  name,
  setName,
  passphrase,
  setPassphrase,
  error,
  loading,
  handleSubmit,
  submitLabel,
}) {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-7">
      <div>
        <label className="block text-[11px] tracking-[0.4em] uppercase text-pastel-mid mb-2 sm:mb-3">
          Your Name
        </label>
        <input
          type="text"
          placeholder="e.g. Gianfranca"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border-b border-pastel-border pb-2 sm:pb-2.5 text-base text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200"
          required
        />
      </div>

      <div>
        <label className="block text-[11px] tracking-[0.4em] uppercase text-pastel-mid mb-2 sm:mb-3">
          Passphrase
        </label>
        <input
          type="password"
          placeholder="••••••••"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full bg-transparent border-b border-pastel-border pb-2 sm:pb-2.5 text-base text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200"
          required
        />
      </div>

      {error && <p className="text-xs sm:text-sm text-pastel-rose -mt-1">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-0.5 sm:mt-1 py-3 sm:py-3.5 bg-pastel-ink text-pastel-card text-xs font-semibold tracking-[0.35em] uppercase hover:bg-pastel-gold hover:text-pastel-ink transition-colors duration-200 disabled:opacity-40"
      >
        {loading ? "..." : submitLabel}
      </button>
    </form>
  );
}
