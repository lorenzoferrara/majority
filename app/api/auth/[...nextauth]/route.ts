import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Passphrase",
      credentials: {
        passphrase: { label: "Passphrase", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.passphrase === process.env.APP_PASSPHRASE) {
          return {
            id: credentials.name, // name is used as the unique voter ID
            name: credentials.name,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/sign-in" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };