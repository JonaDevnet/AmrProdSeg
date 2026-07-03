// AMR — Entry: routes between Login, Dashboard, and Nueva Póliza with a soft fade

function App() {
  const [view, setView] = React.useState(() => {
    if (!sessionStorage.getItem("amr_seen_reportes")) {
      sessionStorage.setItem("amr_seen_reportes", "1");
      return "reportes";
    }
    return localStorage.getItem("amr_view") || "login";
  });
  const [transitioning, setTransitioning] = React.useState(false);
  const [viewData, setViewData] = React.useState(null);

  // Session helpers
  const getSession = () => {
    try { return JSON.parse(localStorage.getItem("amr_session")) || { role: "am", nombre: "AM", email: "alejandro@amrseguros.com.ar" }; }
    catch(e) { return { role: "am", nombre: "AM", email: "alejandro@amrseguros.com.ar" }; }
  };

  const handleLogin = (user) => {
    localStorage.setItem("amr_session", JSON.stringify(user));
    navigate("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("amr_session");
    navigate("login");
  };

  React.useEffect(() => {
    localStorage.setItem("amr_view", view);
  }, [view]);

  const navigate = (next, data = null) => {
    if (next === view) return;
    setViewData(data);
    setTransitioning(true);
    setTimeout(() => {
      setView(next);
      window.scrollTo({ top: 0, behavior: "instant" });
      setTransitioning(false);
    }, 200);
  };

  let screen = null;
  if (view === "login")                 screen = <LoginScreen onLogin={handleLogin} />;
  else if (view === "nueva")            screen = <NuevaPoliza  onNavigate={navigate} onLogout={handleLogout} onSubmit={() => navigate("dashboard")} initialData={viewData} />;
  else if (view === "cobranzas")        screen = <Cobranzas    onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "reportes")         screen = <Reportes     onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "editar-asegurado") screen = <Editar mode="asegurado" onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "editar-vehiculo")  screen = <Editar mode="vehiculo"  onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "editar-cobertura") screen = <Editar mode="cobertura" onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "vendedores")        screen = <Vendedores   onNavigate={navigate} onLogout={handleLogout} />;
  else if (view === "bajas")             screen = <Bajas        onNavigate={navigate} onLogout={handleLogout} initialData={viewData} />;
  else                                   screen = <Dashboard   onNavigate={navigate} onLogout={handleLogout} />;

  return (
    <div style={{
      transition: "opacity .2s ease",
      opacity: transitioning ? 0 : 1,
    }}>
      {screen}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
