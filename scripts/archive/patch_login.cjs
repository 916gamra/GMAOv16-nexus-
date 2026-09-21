const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.jsx', 'utf8');

// Replace storedPin initialization to not use default
code = code.replace(
`  const [storedPin, setStoredPin] = useState(() => {
    const saved = localStorage.getItem('gmao_admin_pin');
    if (saved) {
      return saved;
    }
    // Default PIN is '1234' hashed
    const defaultHash = storageService.hashPin('1234');
    localStorage.setItem('gmao_admin_pin', defaultHash);
    return defaultHash;
  });`,
`  const [storedPin, setStoredPin] = useState(() => {
    return localStorage.getItem('gmao_admin_pin') || null;
  });
  
  const [isFirstRun, setIsFirstRun] = useState(() => !localStorage.getItem('gmao_admin_pin'));
  const [confirmPin, setConfirmPin] = useState('');
`
);

// Replace handleLogin
code = code.replace(
`  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // If Open Mode is false, we MUST validate the entered PIN code using storageService.verifyPin
    if (!isOpenMode) {
      if (!storageService.verifyPin(pinCode, storedPin)) {
        setErrorMsg("Code PIN d'accès incorrect. Veuillez réessayer.");
        return;
      }
    }`,
`  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (isFirstRun) {
      if (!pinCode || pinCode.length < 6) {
        setErrorMsg("Le code PIN doit comporter au moins 6 caractères.");
        return;
      }
      if (pinCode !== confirmPin) {
        setErrorMsg("Les codes PIN ne correspondent pas.");
        return;
      }
      const newHash = storageService.hashPin(pinCode);
      localStorage.setItem('gmao_admin_pin', newHash);
      setStoredPin(newHash);
      setIsFirstRun(false);
    } else if (!isOpenMode) {
      if (!storageService.verifyPin(pinCode, storedPin)) {
        setErrorMsg("Code PIN d'accès incorrect. Veuillez réessayer.");
        return;
      }
    }`
);

// Replace input section
const inputSection = `
            {isOpenMode ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                <Unlock className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                L'accès libre est configuré. Cliquez simplement sur le bouton ci-dessous pour vous connecter directement.
              </div>
            ) : (
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={pinCode}
                  onChange={(e) => {
                    setPinCode(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Saisir le code PIN d'accès..."
                  maxLength={8}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 tracking-widest focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            )}
            
            {!isOpenMode && (
              <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                * Saisissez le code configuré par l'administrateur (Par défaut: 1234).
              </p>
            )}
`;

const newInputSection = `
            {isOpenMode && !isFirstRun ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                <Unlock className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                L'accès libre est configuré. Cliquez simplement sur le bouton ci-dessous pour vous connecter directement.
              </div>
            ) : (
              <div className="space-y-3">
                {isFirstRun && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
                    Bienvenue ! Veuillez configurer un nouveau code PIN (6 chiffres minimum) pour sécuriser l'accès.
                  </div>
                )}
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={isFirstRun ? "Nouveau code PIN..." : "Saisir le code PIN d'accès..."}
                    maxLength={16}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 tracking-widest focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
                {isFirstRun && (
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => {
                        setConfirmPin(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Confirmer le nouveau code PIN..."
                      maxLength={16}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 tracking-widest focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                )}
              </div>
            )}
`;

code = code.replace(inputSection, newInputSection);

fs.writeFileSync('src/components/LoginScreen.jsx', code);
