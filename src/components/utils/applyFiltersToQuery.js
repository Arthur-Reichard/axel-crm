export function applyFiltersToQuery(query, filtres) {
    let updatedQuery = query;
    const allOrConditions = [];
  
    for (const filtre of filtres) {
      if (!filtre.champ || !filtre.type || !filtre.valeur || filtre.valeur.length === 0) continue;
  
      const conditions = filtre.valeur.map(val => {
        const champ = filtre.champ;
        const value = val;
  
        if (filtre.type === "contient") {
          return `${champ}.ilike.%${value}%`;
        } else if (filtre.type === "ne_contient_pas") {
          return `not.${champ}.ilike.%${value}%`;
        } else if (filtre.type === "egal") {
          return `${champ}.eq.${value}`;
        }
        return "";
      }).filter(Boolean);
  
      if (filtre.type === "ne_contient_pas") {
        for (const condition of conditions) {
          updatedQuery = updatedQuery.not(condition);
        }
      } else {
        allOrConditions.push(...conditions);
      }
    }
  
    if (allOrConditions.length > 0) {
      updatedQuery = updatedQuery.or(allOrConditions.join(","));
    }
  
    return updatedQuery;
  }  