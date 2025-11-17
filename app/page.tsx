export default function Home() {
  return (
    <div className="page">
      <div className="container space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-primary">Frutero App Color Palette</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora la vibrante paleta de colores inspirada en frutas frescas.
            Esta aplicación usa los mismos colores que Frutero App.
          </p>
        </section>

        {/* Color Showcase */}
        <section className="section space-y-8">
          <h2>Colores Principales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">Primary</span>
              </div>
              <div>
                <p className="font-medium">Naranja Vibrante</p>
                <p className="text-sm text-muted-foreground">
                  Color principal para acciones importantes
                </p>
              </div>
            </div>

            {/* Secondary */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground font-semibold">Secondary</span>
              </div>
              <div>
                <p className="font-medium">Marrón Rico</p>
                <p className="text-sm text-muted-foreground">
                  Para acciones secundarias
                </p>
              </div>
            </div>

            {/* Accent */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-semibold">Accent</span>
              </div>
              <div>
                <p className="font-medium">Verde Fresco</p>
                <p className="text-sm text-muted-foreground">
                  Para destacar elementos especiales
                </p>
              </div>
            </div>

            {/* Muted */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground font-semibold">Muted</span>
              </div>
              <div>
                <p className="font-medium">Gris Silenciado</p>
                <p className="text-sm text-muted-foreground">
                  Para elementos de fondo
                </p>
              </div>
            </div>

            {/* Destructive */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 bg-destructive rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold">Destructive</span>
              </div>
              <div>
                <p className="font-medium">Rojo Tomate</p>
                <p className="text-sm text-muted-foreground">
                  Para errores y acciones destructivas
                </p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-card rounded-lg p-6 space-y-4 border border-border">
              <div className="h-24 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <span className="text-card-foreground font-semibold">Card</span>
              </div>
              <div>
                <p className="font-medium">Tarjeta</p>
                <p className="text-sm text-muted-foreground">
                  Fondo de tarjetas y contenedores
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Button Examples */}
        <section className="section space-y-8">
          <h2>Ejemplos de Botones</h2>

          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
              Botón Primario
            </button>
            <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
              Botón Secundario
            </button>
            <button className="px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
              Botón de Acento
            </button>
            <button className="px-6 py-3 bg-muted text-muted-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
              Botón Silenciado
            </button>
            <button className="px-6 py-3 bg-destructive text-white rounded-full font-medium hover:opacity-90 transition-opacity">
              Botón Destructivo
            </button>
            <button className="px-6 py-3 border border-border text-foreground rounded-full font-medium hover:bg-muted transition-colors">
              Botón Outline
            </button>
          </div>
        </section>

        {/* Typography */}
        <section className="section space-y-8">
          <h2>Tipografía</h2>

          <div className="space-y-4">
            <h1>Heading 1 - Grande y prominente</h1>
            <h2>Heading 2 - Para secciones</h2>
            <h3>Heading 3 - Para subsecciones</h3>
            <h4>Heading 4 - Para títulos pequeños</h4>
            <p className="text-foreground">
              Texto normal con el color foreground principal.
            </p>
            <p className="text-muted-foreground">
              Texto silenciado para información secundaria.
            </p>
            <a href="#" className="text-primary hover:underline">
              Enlace con color primario
            </a>
          </div>
        </section>

        {/* Cards */}
        <section className="section space-y-8">
          <h2>Tarjetas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-2">Tarjeta Normal</h3>
              <p className="text-muted-foreground">
                Esta es una tarjeta con el fondo card y borde border.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-6">
              <h3 className="mb-2">Tarjeta Silenciada</h3>
              <p className="text-muted-foreground">
                Esta tarjeta usa el fondo muted para menos énfasis.
              </p>
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
            Integrado con Hardhat para desarrollo Web3
          </p>
        </footer>
      </div>
    </div>
  );
}
