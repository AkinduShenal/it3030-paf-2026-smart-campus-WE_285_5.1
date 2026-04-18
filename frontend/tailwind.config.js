/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	corePlugins: {
		preflight: false
	},
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#eef4ff",
					100: "#dbe7ff",
					600: "#1f3a69",
					700: "#17325c"
				}
			}
		}
	},
	plugins: []
};
