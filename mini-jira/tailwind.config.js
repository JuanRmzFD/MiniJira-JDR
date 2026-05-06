/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // ─── shadcn/ui tokens (CSS variables) ───────────────────────────────
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ─── Design System tokens (DESIGN.md) — prefijo "ds-" ───────────
        // USO OBLIGATORIO. Prohibido usar colores Tailwind genéricos
        // (slate, blue, red, green, amber, etc.) fuera de estos tokens.
        ds: {
          // Surfaces
          surface:                    '#faf8fe',
          'surface-dim':              '#dad9df',
          'surface-bright':           '#faf8fe',
          'surface-container-lowest': '#ffffff',
          'surface-container-low':    '#f4f3f8',
          'surface-container':        '#eeedf3',
          'surface-container-high':   '#e9e7ed',
          'surface-container-highest':'#e3e2e7',
          'surface-variant':          '#e3e2e7',

          // On-surfaces (texto sobre surfaces)
          'on-surface':               '#1a1b1f',
          'on-surface-variant':       '#414755',
          'inverse-surface':          '#2f3034',
          'inverse-on-surface':       '#f1f0f5',

          // Bordes
          outline:                    '#717786',
          'outline-variant':          '#c1c6d7',

          // Primary (azul — acción principal, En Progreso, prioridad Baja)
          primary:                    '#0058bc',
          'on-primary':               '#ffffff',
          'primary-container':        '#0070eb',
          'on-primary-container':     '#fefcff',
          'inverse-primary':          '#adc6ff',
          'primary-fixed':            '#d8e2ff',
          'primary-fixed-dim':        '#adc6ff',
          'on-primary-fixed':         '#001a41',
          'on-primary-fixed-variant': '#004493',
          'surface-tint':             '#005bc1',

          // Secondary (gris neutro — estado Listo, texto secundario)
          secondary:                  '#5d5e60',
          'on-secondary':             '#ffffff',
          'secondary-container':      '#dfdfe1',
          'on-secondary-container':   '#616365',
          'secondary-fixed':          '#e2e2e4',
          'secondary-fixed-dim':      '#c6c6c8',
          'on-secondary-fixed':       '#1a1c1d',
          'on-secondary-fixed-variant':'#454749',

          // Tertiary (naranja/ámbar — prioridad Media)
          tertiary:                   '#9e3d00',
          'on-tertiary':              '#ffffff',
          'tertiary-container':       '#c64f00',
          'on-tertiary-container':    '#fffbff',
          'tertiary-fixed':           '#ffdbcc',
          'tertiary-fixed-dim':       '#ffb595',
          'on-tertiary-fixed':        '#351000',
          'on-tertiary-fixed-variant':'#7c2e00',

          // Error (rojo — prioridad Alta, acciones destructivas)
          error:                      '#ba1a1a',
          'on-error':                 '#ffffff',
          'error-container':          '#ffdad6',
          'on-error-container':       '#93000a',

          // Background
          background:                 '#faf8fe',
          'on-background':            '#1a1b1f',
        },
      },

      // ─── Radios de esquina (DESIGN.md) ──────────────────────────────────
      borderRadius: {
        sm:      '0.25rem',   // 4px  — detalles internos
        DEFAULT: '0.5rem',    // 8px  — botones, inputs, cards pequeñas
        md:      '0.75rem',   // 12px
        lg:      '1rem',      // 16px — modales, paneles principales
        xl:      '1.5rem',    // 24px
        full:    '9999px',    // chips / badges
      },

      // ─── Sombras de elevación (DESIGN.md) ───────────────────────────────
      boxShadow: {
        card:  '0px 1px 3px rgba(0,0,0,0.05), 0px 10px 20px rgba(0,0,0,0.03)',
        modal: '0px 4px 24px rgba(0,0,0,0.10), 0px 1px 4px rgba(0,0,0,0.06)',
      },

      // ─── Tipografía (DESIGN.md) ──────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1':         ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2':         ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-base':  ['14px', { lineHeight: '20px', letterSpacing: '0' }],
        'body-sm':    ['13px', { lineHeight: '18px', letterSpacing: '0' }],
        'label-caps': ['11px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'btn':        ['14px', { lineHeight: '20px', fontWeight: '500' }],
      },

      // ─── Espaciado (DESIGN.md: base-unit 4px) ───────────────────────────
      spacing: {
        'container-px': '24px',
        'element-gap':  '12px',
        'section-gap':  '32px',
        'gutter':       '16px',
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
