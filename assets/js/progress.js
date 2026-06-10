window.PhpLabProgress = (() => {
  const STORAGE_KEY = "php-beginner-lab-progress-v1";
  const data = window.PhpLabData;

  const createDefaultState = () => ({
    completedLessons: [],
    quizScores: [],
    completedRecall: [],
    completedDebug: [],
    badges: [],
    darkMode: false,
    lastLesson: null
  });

  const uniqueStrings = (value) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item) => typeof item === "string"))];
  };

  const sanitizeState = (value = {}) => ({
    completedLessons: uniqueStrings(value.completedLessons),
    quizScores: Array.isArray(value.quizScores)
      ? value.quizScores.filter((score) => Number.isFinite(score)).map((score) => Math.max(0, Math.min(100, score)))
      : [],
    completedRecall: uniqueStrings(value.completedRecall),
    completedDebug: uniqueStrings(value.completedDebug),
    badges: uniqueStrings(value.badges),
    darkMode: Boolean(value.darkMode),
    lastLesson: typeof value.lastLesson === "string" ? value.lastLesson : null
  });

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? sanitizeState(JSON.parse(saved)) : createDefaultState();
    } catch (error) {
      console.warn("Progress tidak dapat dibaca. Memulai dengan data baru.", error);
      return createDefaultState();
    }
  };

  let state = loadProgress();

  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const unlockBadges = () => {
    const unlockedNow = [];
    data.badges.forEach((badge) => {
      if (badge.check(state) && !state.badges.includes(badge.id)) {
        state.badges.push(badge.id);
        unlockedNow.push(badge.title);
      }
    });
    if (unlockedNow.length) saveProgress();
    return unlockedNow;
  };

  const addUnique = (key, id) => {
    if (!state[key].includes(id)) {
      state[key].push(id);
      saveProgress();
      return true;
    }
    return false;
  };

  const markLesson = (id) => {
    const added = addUnique("completedLessons", id);
    const unlocked = unlockBadges();
    return { added, unlocked };
  };

  const markRecall = (id) => {
    const added = addUnique("completedRecall", id);
    const unlocked = unlockBadges();
    return { added, unlocked };
  };

  const markDebug = (id) => {
    const added = addUnique("completedDebug", id);
    const unlocked = unlockBadges();
    return { added, unlocked };
  };

  const saveQuizScore = (score) => {
    state.quizScores.push(Math.max(0, Math.min(100, Math.round(score))));
    saveProgress();
    unlockBadges();
  };

  const setLastLesson = (id) => {
    state.lastLesson = id;
    saveProgress();
  };

  const setDarkMode = (enabled) => {
    state.darkMode = Boolean(enabled);
    saveProgress();
  };

  const getAverageQuiz = () => {
    if (!state.quizScores.length) return 0;
    const total = state.quizScores.reduce((sum, score) => sum + score, 0);
    return Math.round(total / state.quizScores.length);
  };

  const getTotalProgress = () => {
    const completed =
      state.completedLessons.length +
      state.completedRecall.length +
      state.completedDebug.length +
      (state.quizScores.length ? 1 : 0);
    const total =
      data.lessons.length +
      data.recallChallenges.length +
      data.debugChallenges.length +
      1;
    return Math.round((completed / total) * 100);
  };

  const resetProgress = () => {
    const darkMode = state.darkMode;
    state = { ...createDefaultState(), darkMode };
    saveProgress();
  };

  return {
    get state() {
      return state;
    },
    saveProgress,
    loadProgress,
    unlockBadges,
    markLesson,
    markRecall,
    markDebug,
    saveQuizScore,
    setLastLesson,
    setDarkMode,
    getAverageQuiz,
    getTotalProgress,
    resetProgress
  };
})();
