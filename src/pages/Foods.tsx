import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { foods } from "../store";
import { searchFoods } from "../lib/health";
import type { Food } from "../lib/types";
import { Modal, Note, number } from "../components/ui";
import { nutrients } from "../lib/health";

export function Foods({ onAdd }: { onAdd: (food: Food) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Food | null>(null);
  const results = searchFoods(foods, query, category);
  const categories = [...new Set(foods.map((f) => f.category))];
  const size = 15;
  return (
    <>
      <section className="library-banner">
        <div className="round-icon">
          <BookOpen size={25} />
        </div>
        <div>
          <span className="eyebrow">CONHEÇA O QUE VOCÊ COME</span>
          <h2>Mais informação em cada escolha.</h2>
          <p>
            Explore {foods.length} alimentos da Tabela Brasileira de Composição
            de Alimentos.
          </p>
        </div>
        <span className="source-tag">
          TACO · UNICAMP
          <ArrowUpRight size={14} />
        </span>
      </section>
      <section className="card food-library">
        <div className="library-filters">
          <label className="search-box">
            <Search size={19} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Busque por alimento ou preparação…"
              aria-label="Buscar na biblioteca de alimentos"
            />
          </label>
          <label className="category-select">
            <SlidersHorizontal size={17} />
            <select
              aria-label="Categoria do alimento"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table className="foods-table">
            <thead>
              <tr>
                <th>
                  Alimento <small>por 100 g</small>
                </th>
                <th>Energia</th>
                <th>Proteínas</th>
                <th>Carboidratos</th>
                <th>Gorduras</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.slice(page * size, (page + 1) * size).map((f) => (
                <tr key={f.id}>
                  <td>
                    <button
                      className="food-name"
                      onClick={() => setSelected(f)}
                    >
                      {f.name}
                      <span>{f.category}</span>
                    </button>
                  </td>
                  {(
                    ["kcal", "protein", "carbohydrates", "lipids"] as const
                  ).map((k) => (
                    <td key={k}>
                      {f.nutrients[k] === null
                        ? "N/D"
                        : `${number(f.nutrients[k]!, 1)} ${k === "kcal" ? "kcal" : "g"}`}
                    </td>
                  ))}
                  <td>
                    <button
                      className="icon-button outlined"
                      onClick={() => onAdd(f)}
                      aria-label={`Registrar ${f.name}`}
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!results.length && (
          <div className="empty">
            <Search size={30} />
            <h3>Nenhum alimento encontrado</h3>
            <p>Experimente outro termo ou altere a categoria.</p>
          </div>
        )}
        <div className="table-pagination">
          <span>
            {results.length
              ? `${page * size + 1}–${Math.min((page + 1) * size, results.length)} de ${results.length}`
              : "0 alimentos"}
          </span>
          <div>
            <button
              className="button secondary small-button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              className="button secondary small-button"
              disabled={(page + 1) * size >= results.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
      <Note>
        Valores por 100 g de parte comestível. Marcas e preparações variam.
        Clique no nome para ver todos os nutrientes disponíveis. A base não
        inclui todas as vitaminas e minerais.
      </Note>
      {selected && (
        <Modal
          title={selected.name}
          subtitle="Composição por 100 g · TACO, 4ª edição, 2011"
          onClose={() => setSelected(null)}
          wide
        >
          <div className="form-content">
            <div className="nutrient-grid">
              {nutrients.map((n) => (
                <div key={n.key}>
                  <span>{n.label}</span>
                  <strong>
                    {selected.nutrients[n.key] === null
                      ? "N/D"
                      : number(selected.nutrients[n.key]!, 2)}{" "}
                    <small>{n.unit}</small>
                  </strong>
                </div>
              ))}
            </div>
            <Note>
              N/D significa dado não disponível. Zero pode incluir traços
              arredondados na digitalização. Retinol, RE e RAE são expressões
              alternativas de vitamina A, não nutrientes a somar.
            </Note>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
            <button
              className="button"
              onClick={() => {
                onAdd(selected);
                setSelected(null);
              }}
            >
              <Plus size={16} />
              Registrar porção
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
