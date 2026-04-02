/**
 * Utilitaires pour la gestion des réponses aux tests
 * Flux: index en transit, texte en stockage (aligné sur le backend)
 */

/**
 * Normalise les options renvoyées par l'API (tableau JSON ou tableau déjà parsé)
 */
export const parseOptionsFromApi = (options: unknown): string[] => {
  if (Array.isArray(options)) {
    return options.map(o => (o == null ? '' : String(o)));
  }
  return [];
};

/**
 * Retire un préfixe du type "A) ", "B." si c'est la lettre attendue pour cet index
 * (évite A) A) … quand l'IA a déjà préfixé le texte de l'option).
 */
export const stripOptionIndexPrefix = (option: string, index: number): string => {
  if (option == null || option === '') return '';
  const letter = String.fromCharCode(65 + index);
  const trimmed = option.trim();
  const re = new RegExp(`^${letter}\\)\\s*|^${letter}\\.\\s*`, 'i');
  return trimmed.replace(re, '').trim();
};

/**
 * Ajuste l'index de la bonne réponse après suppression d'une option.
 */
export const adjustCorrectIndexAfterRemove = (
  correctIndex: number,
  removedIndex: number,
  newOptionCount: number
): number => {
  if (newOptionCount <= 0) return 0;
  let next = correctIndex;
  if (removedIndex < correctIndex) next -= 1;
  else if (removedIndex === correctIndex) next = 0;
  return Math.min(Math.max(0, next), newOptionCount - 1);
};

/**
 * Convertit le texte d'une correctAnswer (venant du backend) en index frontend
 * Le backend stocke le texte mais nous devons retrouver l'index correspondant
 */
export const correctAnswerToIndex = (
  correctAnswer: any,
  options: string[]
): number => {
  const opts = parseOptionsFromApi(options);
  if (opts.length === 0) return 0;

  // 🎯 FORMAT NUMÉRIQUE DIRECT (nouveau format optimal)
  if (typeof correctAnswer === 'number' && Number.isFinite(correctAnswer)) {
    const n = Math.round(correctAnswer);
    return n >= 0 && n < opts.length ? n : 0;
  }

  if (typeof correctAnswer === 'string') {
    const trimmed = correctAnswer.trim();

    // 🎯 FORMAT NUMÉRIQUE EN CHAINE (nouveau format)
    if (/^\d+$/.test(trimmed)) {
      const index = parseInt(trimmed, 10);
      if (index >= 0 && index < opts.length) {
        return index;
      }
    }

    // 🎯 FORMAT SPÉCIAL LEGACY: INDEX_X_VALUE_Y (compatibilité)
    if (trimmed.startsWith('INDEX_') && trimmed.includes('_VALUE_')) {
      try {
        const parts = trimmed.split('_VALUE_');
        if (parts.length >= 2 && parts[0].startsWith('INDEX_')) {
          const indexStr = parts[0].substring(6); // Enlever "INDEX_"
          const index = parseInt(indexStr, 10);
          if (!isNaN(index) && index >= 0 && index < opts.length) {
            return index;
          }
        }
      } catch (e) {
        console.warn('Failed to parse special format:', correctAnswer);
      }
    }

    // 🎯 FORMAT PRIMAIRE: Lettre seule "A", "B", "C", "D"
    const letterMatch = trimmed.match(/^([A-Za-z])$/);
    if (letterMatch) {
      const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return idx;
    }

    // 🎯 FORMAT SECONDAIRE: "A)", "B)", "C)", "D)"
    const letterParenMatch = trimmed.match(/^([A-Za-z])\)\s*/);
    if (letterParenMatch) {
      const idx = letterParenMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return idx;
    }

    // 🎯 FORMAT TERTIAIRE: "A.", "B.", "C.", "D."
    const letterDotMatch = trimmed.match(/^([A-Za-z])\.\s*/);
    if (letterDotMatch) {
      const idx = letterDotMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return idx;
    }

    // 🚨 FORMAT DANGEREUX: Texte exact (problème avec options identiques)
    // DÉPLACÉ À LA FIN - seulement si aucun format lettre trouvé
    // 🎯 CORRECTION: Si le texte est identique dans plusieurs options, utiliser l'index du backend
    const exactIndex = opts.findIndex(opt => opt === correctAnswer);
    if (exactIndex >= 0) {
      const identicalCount = opts.filter(opt => opt === correctAnswer).length;
      if (identicalCount === 1) {
        // Option unique - utiliser l'index trouvé
        return exactIndex;
      } else {
        // Options identiques - vérifier si le backend a envoyé un index séparément
        console.warn(`⚠️ Options identiques détectées pour "${correctAnswer}", count: ${identicalCount}`);
        // Si le backend a envoyé un index séparément (correctAnswerIndex), l'utiliser
        // Sinon, utiliser la première occurrence (fallback)
        console.log(`🎯 Utilisation de l'index ${exactIndex} pour "${correctAnswer}" (première occurrence)`);
        return exactIndex;
      }
    }

    // Insensible à la casse / espaces (seulement si unique)
    const ciIndex = opts.findIndex(
      opt => opt.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (ciIndex >= 0 && opts.filter(opt => opt.trim().toLowerCase() === trimmed.toLowerCase()).length === 1) {
      return ciIndex;
    }

    // Correspondance partielle (dernier recours, éviter les faux positifs)
    if (trimmed.length >= 2) {
      const partialIndex = opts.findIndex(opt => {
        const t = trimmed.toLowerCase();
        const o = opt.toLowerCase();
        return o === t || o.includes(t) || t.includes(o);
      });
      if (partialIndex >= 0) return partialIndex;
    }
  }

  return 0;
};

/**
 * Convertit un index frontend en texte complet de l'option (pour envoyer au backend)
 * Le backend stockera le texte dans answer_text et l'index dans selected_option
 */
export const indexToCorrectAnswer = (
  index: number,
  options: string[]
): string => {
  const opts = parseOptionsFromApi(options);
  if (opts.length === 0) return '';
  const i =
    Number.isFinite(index) && index >= 0 && index < opts.length
      ? Math.floor(index)
      : 0;
  
  const selectedOption = opts[i]?.trim() ?? opts[0]?.trim() ?? '';
  
  // 🎯 ENVOYER LE TEXTE DE L'OPTION - le backend extraira l'index lui-même
  console.log(`🎯 Envoi texte "${selectedOption}" (index ${i}) pour options [${opts.join(', ')}]`);
  return selectedOption;
};

/**
 * Normalise le correct_answer brut de l'IA → index
 * Gère tous les formats possibles retournés par l'IA
 */
export const normalizeAiCorrectAnswer = (
  correctAnswer: any,
  options: string[]
): number => {
  return correctAnswerToIndex(correctAnswer, options);
};

/** Indique si l'option à cet index est la bonne réponse (pour UI). */
export const isCorrectOptionIndex = (
  optionIndex: number,
  correctAnswer: number | string | undefined | null,
  options: string[]
): boolean => {
  const idx = correctAnswerToIndex(correctAnswer, options);
  return idx === optionIndex;
};
