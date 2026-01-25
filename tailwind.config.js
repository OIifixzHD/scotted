/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'sans-serif'
  			],
  			display: [
  				'Cal Sans',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'Fira Code',
  				'Consolas',
  				'monospace'
  			]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
            // Pulse Brand Colors
            pulse: {
                dark: '#0f0f16',
                purple: '#7c3aed',
                teal: '#2dd4bf',
                glass: 'rgba(15, 15, 22, 0.6)',
            },
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			ring: 'hsl(var(--ring))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		boxShadow: {
  			soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  			glow: '0 0 20px -5px rgba(124, 58, 237, 0.4)',
  			'glow-lg': '0 0 40px -10px rgba(124, 58, 237, 0.5)',
            'neon': '0 0 10px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.3)',
  			glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
  		},
  		keyframes: {
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
            'heart-beat': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.3)' }
            },
            'neon-pulse': {
                '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)' },
                '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(124, 58, 237, 0.8)' }
            },
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
            'marquee': {
                '0%': { transform: 'translateX(0%)' },
                '100%': { transform: 'translateX(-100%)' }
            },
            'spin-slow': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
            },
            'gradient-xy': {
                '0%, 100%': {
                    'background-size': '400% 400%',
                    'background-position': 'left center'
                },
                '50%': {
                    'background-size': '200% 200%',
                    'background-position': 'right center'
                }
            }
  		},
  		animation: {
  			'fade-in': 'fade-in 0.6s ease-out',
            'heart-beat': 'heart-beat 0.3s ease-in-out',
            'neon-pulse': 'neon-pulse 2s infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
            'marquee': 'marquee 10s linear infinite',
            'spin-slow': 'spin-slow 3s linear infinite',
            'gradient-xy': 'gradient-xy 15s ease infinite',
  		},
  		backgroundImage: {
  			'gradient-primary': 'linear-gradient(135deg, #7c3aed, #2dd4bf)',
            'gradient-dark': 'linear-gradient(to bottom, rgba(15,15,22,0), rgba(15,15,22,1))',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}