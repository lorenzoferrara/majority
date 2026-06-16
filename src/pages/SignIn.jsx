import SignInForm from "../components/SignInForm";
import { useSignIn } from "../hooks/useSignIn";

export default function SignIn() {
  const {
    name,
    setName,
    passphrase,
    setPassphrase,
    error,
    loading,
    handleSubmit,
  } = useSignIn();

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #FDFAF7 inset !important;
          -webkit-text-fill-color: #1C1712 !important;
          caret-color: #1C1712;
        }
      `}</style>
      <div className="relative w-full max-w-5xl border border-pastel-border bg-pastel-card px-5 sm:px-12 lg:px-16 py-8 sm:py-12 lg:py-14 overflow-hidden">
        <div aria-hidden className="absolute -top-20 -left-16 h-56 w-56 rounded-full border border-pastel-border/70" />
        <div aria-hidden className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-pastel-border/70" />

        <div className="relative flex items-center gap-3 mb-8 sm:mb-10 lg:mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-start">
          <div aria-hidden className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-pastel-border/70" />

          <section className="md:pr-5 lg:pr-6 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-[3.9rem] lg:text-[4.8rem] font-light text-pastel-ink leading-[0.94] mb-4">
              What Do We Read Next?
            </h1>
            <p className="text-xs tracking-[0.25em] uppercase text-pastel-mid mb-6">
              Monthly Pick - {new Date().getFullYear()}
            </p>

            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <div className="h-px w-8 bg-pastel-border" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-pastel-muted">Rank · Decide · Read</span>
              <div className="h-px w-8 bg-pastel-border" />
            </div>

            <p className="text-pastel-mid text-base sm:text-lg leading-relaxed mb-0 max-w-lg mx-auto">
              Rank your favourite candidates. The instant-runoff method will find the book everyone can get behind.
            </p>
          </section>

          <section className="md:pl-5 lg:pl-6">
            <div className="border-4 border-pastel-ink/40 bg-white px-5 sm:px-7 py-6 sm:py-8 relative shadow-[4px_4px_0_0_rgba(92,32,0,0.15)]">
              <div className="hidden md:block mb-8">
                <h2 className="font-display text-4xl sm:text-5xl font-light text-pastel-ink leading-none mb-3">Enter</h2>
                <p className="text-sm tracking-wide text-pastel-mid">Members only - sign in to vote.</p>
              </div>

              <SignInForm
                name={name}
                setName={setName}
                passphrase={passphrase}
                setPassphrase={setPassphrase}
                error={error}
                loading={loading}
                handleSubmit={handleSubmit}
                submitLabel="Sign In To Vote"
              />
            </div>
          </section>
        </div>

        <p className="mt-10 text-[11px] tracking-[0.2em] uppercase text-pastel-muted text-center">
          Majority · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
