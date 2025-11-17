import Link from 'next/link';

export default function Home() {
  return (
    <div className="page">
      <div className="container space-y-12">
        {/* Header */}
        <section className="text-center space-y-6">
          <h1 className="text-primary">$PULPA NFC Distribution System</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sistema de distribución de tokens $PULPA mediante NFC stickers.
            Embajadores distribuyen tokens a nuevos usuarios escaneando NFC tags.
          </p>
        </section>

        {/* Demo Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Demo de Funcionalidades
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Test NFC - Registered */}
            <Link
              href="/nfc/TEST123"
              className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-bold text-foreground">
                  NFC Registrado (TEST123)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Simula el escaneo de un NFC ya registrado. Te enviará a la página de distribución.
                </p>
                <div className="flex items-center gap-2 text-xs text-accent">
                  <span>Embajador:</span>
                  <span className="font-mono">El Frutero 🍎</span>
                </div>
              </div>
            </Link>

            {/* Test NFC - New */}
            <Link
              href="/nfc/NUEVONFC123"
              className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-2xl">➕</span>
                </div>
                <h3 className="font-bold text-foreground">
                  NFC Nuevo (NUEVONFC123)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Simula el escaneo de un NFC sin registrar. Te llevará al formulario de registro.
                </p>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <span>Estado:</span>
                  <span>Sin embajador asignado</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Funcionalidades Implementadas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold text-foreground mb-2">
                Ticket 1.1: NFC Landing Page
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validación de NFC ID</li>
                <li>• Detección de estado</li>
                <li>• Routing automático</li>
                <li>• Estados de carga y error</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold text-foreground mb-2">
                Ticket 1.2: Formulario de Registro
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Resolución de ENS</li>
                <li>• Selector de frutas emoji</li>
                <li>• Validación completa</li>
                <li>• Avatar ENS (opcional)</li>
              </ul>
            </div>

            <div className="p-4 bg-card rounded-lg border border-dashed border-border">
              <div className="text-3xl mb-2">🚧</div>
              <h4 className="font-semibold text-foreground mb-2">
                Próximos Tickets
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Base de datos Prisma (1.3)</li>
                <li>• Perfil embajador (1.5)</li>
                <li>• Distribución tokens (Epic 2)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Stack Tecnológico
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Next.js 16', emoji: '⚛️' },
              { name: 'Tailwind CSS 4', emoji: '🎨' },
              { name: 'Wagmi v2', emoji: '🔗' },
              { name: 'Viem', emoji: '⚡' },
              { name: 'RainbowKit', emoji: '🌈' },
              { name: 'Hardhat', emoji: '⛑️' },
              { name: 'Optimism', emoji: '🔴' },
              { name: 'PostgreSQL', emoji: '🐘' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="p-4 bg-card rounded-lg text-center border border-border"
              >
                <div className="text-3xl mb-2">{tech.emoji}</div>
                <p className="text-sm font-medium text-foreground">
                  {tech.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="max-w-2xl mx-auto space-y-4 p-6 bg-card rounded-lg border border-border">
          <h3 className="font-bold text-foreground text-center">
            ℹ️ Información del Proyecto
          </h3>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Token:</span>
              <span>$PULPA (ERC20)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Chain:</span>
              <span>Optimism Mainnet (Chain ID: 10)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Contract:</span>
              <span className="font-mono text-xs">0x029263...C2f30</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Distribución:</span>
              <span>1 $PULPA (embajador) + 5 $PULPA (usuario)</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-12 pb-8">
          <p>
            Paleta de colores de{" "}
            <a
              href="https://github.com/fruteroclub/frutero-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Frutero App
            </a>
          </p>
          <p className="mt-2">
            Sistema de distribución NFC para tokens $PULPA
          </p>
        </footer>
      </div>
    </div>
  );
}
