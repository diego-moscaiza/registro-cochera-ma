// Función para determinar el tema
const shouldBeDarkMode = (): boolean => {
	return (
		localStorage.getItem("color-theme") === "dark" ||
		(!("color-theme" in localStorage) &&
			window.matchMedia("(prefers-color-scheme: dark)").matches)
	);
};

// Función para aplicar el tema
export const applyColorTheme = (): void => {
	if (shouldBeDarkMode()) {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
};

// Función para cambiar entre temas
export const toggleDarkMode = (): void => {
	if (shouldBeDarkMode()) {
		localStorage.setItem("color-theme", "light");
		document.documentElement.classList.remove("dark");
	} else {
		localStorage.setItem("color-theme", "dark");
		document.documentElement.classList.add("dark");
	}
};

// Script inicial para evitar parpadeo de tema incorrecto
export const inlineThemeScript = `
  (function() {
    if (
      localStorage.getItem("color-theme") === "dark" ||
      (!localStorage.getItem("color-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  })();
`;

// Aplicar tema después de la carga de componentes/API
export const applyThemeAfterLoad = async (
	condition: () => boolean = () => true,
	maxWaitTime: number = 1000
): Promise<void> => {
	return new Promise((resolve) => {
		const startTime = Date.now();

		const checkCondition = () => {
			// Si la condición se cumple o se agotó el tiempo, aplicar el tema
			if (condition() || Date.now() - startTime > maxWaitTime) {
				applyColorTheme();
				resolve();
			} else {
				// Volver a verificar después de un breve retraso
				setTimeout(checkCondition, 50);
			}
		};

		checkCondition();
	});
};

// No ejecutar automáticamente aquí
