export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">✉</span>
            </div>
            <span className="text-white text-2xl font-bold">SecureMail</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Votre messagerie,<br />
            <span className="text-indigo-300">sécurisée par défaut.</span>
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Chiffrement PGP de bout en bout. Vos emails, vos clés, votre confidentialité.
          </p>

          <div className="space-y-3">
            {[
              { icon: '🔐', text: 'Chiffrement RSA 4096 bits' },
              { icon: '🛡️', text: 'Zéro accès tiers à vos données' },
              { icon: '⚡', text: 'Interface rapide et intuitive' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-indigo-100">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-400 text-sm">
          © 2026 SecureMail. Tous droits réservés.
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">✉</span>
            </div>
            <span className="text-gray-900 dark:text-white text-xl font-bold">SecureMail</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}