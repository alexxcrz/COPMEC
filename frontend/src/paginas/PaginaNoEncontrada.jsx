export default function PaginaNoEncontrada({ contexto }) {
  const { setPage, PAGE_DASHBOARD } = contexto;

  return (
    <section className="page-grid narrow-page">
      <article className="surface-card form-card not-found-card">
        <h3>404</h3>
        <p>Página no encontrada</p>
        <span>Lo sentimos, la página que busca no existe o se ha movido.</span>
        <button type="button" className="primary-button" onClick={() => setPage(PAGE_DASHBOARD)}>Ir a casa</button>
      </article>
    </section>
  );
}
