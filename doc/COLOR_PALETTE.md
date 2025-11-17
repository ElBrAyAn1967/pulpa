# Frutero App - Paleta de Colores

Esta es la paleta de colores extraída de [frutero-app](https://github.com/fruteroclub/frutero-app) e integrada en tu proyecto.

## 🎨 Colores Principales

### Light Mode (Modo Claro)

#### Colores Base
- **Background**: `oklch(0.9895 0.009 78.28)` - Fondo crema cálido
- **Foreground**: `oklch(0.0969 0 0)` - Texto oscuro
- **Card**: `oklch(0.9851 0 0)` - Tarjetas blancas
- **Card Background**: `#fcf2e9` - Fondo de tarjeta melocotón

#### Colores de Marca
- **Primary**: `oklch(0.7652 0.1752 62.57)` - **Naranja vibrante** (como frutas frescas)
  - Foreground: `oklch(0.9851 0 0)` - Texto blanco sobre primario
- **Secondary**: `oklch(0.6519 0.2118 22.71)` - **Marrón rico**
  - Foreground: `oklch(0.9851 0 0)` - Texto blanco sobre secundario
- **Accent**: `oklch(0.7989 0.1902 126.36)` - **Verde fresco**
  - Foreground: `oklch(0.0969 0 0)` - Texto oscuro sobre acento

#### Estados
- **Muted**: `oklch(0.274 0.006 286.033)` - Gris oscuro silenciado
  - Foreground: `oklch(0.6467 0 0)` - Texto gris medio
- **Destructive**: `oklch(0.704 0.191 22.216)` - **Rojo tomate** (errores)

#### Bordes & Inputs
- **Border**: `oklch(1 0 0 / 15%)` - Borde claro
- **Input**: `oklch(1 0 0 / 15%)` - Borde de input claro
- **Ring**: `oklch(0.554 0.135 66.442)` - Anillo de enfoque naranja

### Dark Mode (Modo Oscuro)

#### Colores Base
- **Background**: `oklch(0.141 0.005 285.823)` - Gris muy oscuro
- **Foreground**: `oklch(0.985 0 0)` - Texto casi blanco
- **Card**: `oklch(0.21 0.006 285.885)` - Tarjeta oscura
- **Card Background**: `#2a2a2a` - Fondo de tarjeta oscuro

#### Colores de Marca
- **Primary**: `oklch(0.795 0.184 86.047)` - **Amarillo/Naranja cálido**
  - Foreground: `oklch(0.421 0.095 57.708)` - Texto con contraste más oscuro
- **Secondary**: `oklch(0.274 0.006 286.033)` - Gris medio oscuro
- **Accent**: `oklch(0.274 0.006 286.033)` - Acento gris oscuro

#### Bordes & Inputs
- **Border**: `oklch(1 0 0 / 10%)` - Borde sutil oscuro
- **Input**: `oklch(1 0 0 / 15%)` - Borde de input sutil
- **Ring**: `oklch(0.554 0.135 66.442)` - Anillo de enfoque naranja

## 📊 Colores de Gráficos

- **Chart 1**: `oklch(0.488 0.243 264.376)` - Púrpura
- **Chart 2**: `oklch(0.696 0.17 162.48)` - Turquesa
- **Chart 3**: `oklch(0.769 0.188 70.08)` - Amarillo
- **Chart 4**: `oklch(0.627 0.265 303.9)` - Rosa
- **Chart 5**: `oklch(0.645 0.246 16.439)` - Coral

## 🔧 Uso en Tailwind CSS

Puedes usar estos colores directamente en tus clases de Tailwind:

### Backgrounds
```jsx
<div className="bg-primary">Fondo naranja vibrante</div>
<div className="bg-secondary">Fondo marrón</div>
<div className="bg-accent">Fondo verde fresco</div>
<div className="bg-muted">Fondo silenciado</div>
<div className="bg-card">Tarjeta</div>
```

### Text Colors
```jsx
<p className="text-primary">Texto naranja</p>
<p className="text-secondary">Texto marrón</p>
<p className="text-accent">Texto verde</p>
<p className="text-muted-foreground">Texto silenciado</p>
<p className="text-foreground">Texto principal</p>
```

### Borders
```jsx
<div className="border border-border">Con borde</div>
<div className="border-primary">Borde primario</div>
<input className="border-input focus:ring-ring" />
```

### Botones
```jsx
<button className="bg-primary text-primary-foreground">
  Botón Primario
</button>
<button className="bg-secondary text-secondary-foreground">
  Botón Secundario
</button>
<button className="bg-accent text-accent-foreground">
  Botón de Acento
</button>
<button className="bg-destructive text-white">
  Botón Destructivo
</button>
```

## 🎭 Dark Mode

Para activar el modo oscuro, simplemente agrega la clase `dark` al elemento raíz:

```jsx
// En tu layout o componente de tema
<html className="dark">
  {/* ... */}
</html>

// O dinámicamente
<html className={isDark ? 'dark' : ''}>
  {/* ... */}
</html>
```

## 🌈 Colores en Formato Hex (aproximados)

Para referencia rápida, aquí están los colores principales en formato hex:

### Light Mode
- Primary: `#F59E0B` (Naranja vibrante)
- Secondary: `#92400E` (Marrón)
- Accent: `#10B981` (Verde)
- Background: `#FEFCFB` (Crema)
- Card Background: `#FCF2E9` (Melocotón claro)

### Dark Mode
- Primary: `#FCD34D` (Amarillo cálido)
- Background: `#1A1A1A` (Muy oscuro)
- Card: `#2A2A2A` (Oscuro)

## 📐 Border Radius

- `--radius`: `0.65rem` (10.4px)
- `--radius-sm`: `0.4rem` (6.4px)
- `--radius-md`: `0.45rem` (7.2px)
- `--radius-lg`: `0.65rem` (10.4px)
- `--radius-xl`: `0.9rem` (14.4px)

## 💡 Consejos de Uso

1. **Consistencia**: Usa siempre `primary` para acciones principales
2. **Contraste**: Los colores ya tienen buenos ratios de contraste para accesibilidad
3. **Jerarquía**:
   - Primary → Acciones principales (CTA, botones importantes)
   - Secondary → Acciones secundarias
   - Accent → Destacar información especial
   - Muted → Información de fondo o menos importante
4. **Dark Mode**: Los colores se ajustan automáticamente con la clase `dark`

## 🔗 Referencia

- Paleta original: [frutero-app/src/styles/globals.css](https://github.com/fruteroclub/frutero-app/blob/main/src/styles/globals.css)
- Formato de color: OKLCH (mejor percepción visual que HSL/RGB)
- Sistema de diseño: Inspirado en shadcn/ui con paleta personalizada

## 🎨 Visualización Rápida

```
Light Mode:
┌─────────────────────────────────┐
│ Background (Crema cálido)       │
│  ┌───────────────────────────┐  │
│  │ Primary (Naranja)         │  │
│  │ Secondary (Marrón)        │  │
│  │ Accent (Verde)            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘

Dark Mode:
┌─────────────────────────────────┐
│ Background (Muy oscuro)         │
│  ┌───────────────────────────┐  │
│  │ Primary (Amarillo cálido) │  │
│  │ Secondary (Gris)          │  │
│  │ Accent (Gris)             │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```
