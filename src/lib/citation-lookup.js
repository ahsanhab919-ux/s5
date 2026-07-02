export async function searchCrossRef(query, type = "works") {
  const encoded = encodeURIComponent(query);
  const url = `https://api.crossref.org/works?query=${encoded}&rows=5&select=DOI,title,author,published-print,published-online,container-title,volume,issue,page,publisher,type`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("CrossRef API error");
    }
    
    const data = await response.json();
    
    return data.message.items.map((item) => ({
      source: "crossref",
      doi: item.DOI,
      title: item.title?.[0] || "Untitled",
      authors: item.author?.map((a) => ({
        given: a.given || "",
        family: a.family || "",
      })) || [],
      year: item["published-print"]?.["date-parts"]?.[0]?.[0] || 
            item["published-online"]?.["date-parts"]?.[0]?.[0] || "",
      journal: item["container-title"]?.[0] || "",
      volume: item.volume || "",
      issue: item.issue || "",
      pages: item.page || "",
      publisher: item.publisher || "",
      type: item.type || "journal-article",
    }));
  } catch (error) {
    console.error("CrossRef search error:", error);
    return [];
  }
}

export async function searchOpenLibrary(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encoded}&limit=5&fields=key,title,author_name,first_publish_year,publisher,isbn,number_of_pages_median`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Open Library API error");
    }
    
    const data = await response.json();
    
    return data.docs.map((item) => ({
      source: "openlibrary",
      key: item.key,
      title: item.title || "Untitled",
      authors: item.author_name?.map((name) => {
        const parts = name.split(" ");
        return {
          given: parts.slice(0, -1).join(" "),
          family: parts[parts.length - 1] || "",
        };
      }) || [],
      year: item.first_publish_year || "",
      publisher: item.publisher?.[0] || "",
      isbn: item.isbn?.[0] || "",
      pages: item.number_of_pages_median || "",
      type: "book",
    }));
  } catch (error) {
    console.error("Open Library search error:", error);
    return [];
  }
}

export async function lookupByDOI(doi) {
  const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "");
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const item = data.message;
    
    return {
      source: "crossref",
      doi: item.DOI,
      title: item.title?.[0] || "Untitled",
      authors: item.author?.map((a) => ({
        given: a.given || "",
        family: a.family || "",
      })) || [],
      year: item["published-print"]?.["date-parts"]?.[0]?.[0] || 
            item["published-online"]?.["date-parts"]?.[0]?.[0] || "",
      journal: item["container-title"]?.[0] || "",
      volume: item.volume || "",
      issue: item.issue || "",
      pages: item.page || "",
      publisher: item.publisher || "",
      type: item.type || "journal-article",
    };
  } catch (error) {
    console.error("DOI lookup error:", error);
    return null;
  }
}

export async function lookupByISBN(isbn) {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/isbn/${cleanIsbn}.json`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const item = await response.json();
    
    const authorsPromises = (item.authors || []).map(async (author) => {
      try {
        const authorRes = await fetch(`https://openlibrary.org${author.key}.json`);
        const authorData = await authorRes.json();
        const name = authorData.name || "";
        const parts = name.split(" ");
        return {
          given: parts.slice(0, -1).join(" "),
          family: parts[parts.length - 1] || "",
        };
      } catch {
        return { given: "", family: "" };
      }
    });
    
    const authors = await Promise.all(authorsPromises);
    
    return {
      source: "openlibrary",
      key: item.key,
      title: item.title || "Untitled",
      authors,
      year: item.publish_date ? new Date(item.publish_date).getFullYear() : "",
      publisher: item.publishers?.[0] || "",
      isbn: cleanIsbn,
      pages: item.number_of_pages || "",
      type: "book",
    };
  } catch (error) {
    console.error("ISBN lookup error:", error);
    return null;
  }
}

export function formatCitation(item, style = "apa") {
  const formatAuthorsAPA = (authors) => {
    if (!authors?.length) return "";
    if (authors.length === 1) {
      return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}.`;
    }
    if (authors.length === 2) {
      return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}., & ${authors[1].family}, ${authors[1].given?.charAt(0) || ""}.`;
    }
    return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}., et al.`;
  };
  
  const formatAuthorsMLA = (authors) => {
    if (!authors?.length) return "";
    if (authors.length === 1) {
      return `${authors[0].family}, ${authors[0].given}.`;
    }
    if (authors.length === 2) {
      return `${authors[0].family}, ${authors[0].given}, and ${authors[1].given} ${authors[1].family}.`;
    }
    return `${authors[0].family}, ${authors[0].given}, et al.`;
  };
  
  const formatAuthorsChicago = (authors) => {
    if (!authors?.length) return "";
    if (authors.length === 1) {
      return `${authors[0].family}, ${authors[0].given}.`;
    }
    if (authors.length <= 3) {
      const last = authors.length - 1;
      return authors.map((a, i) => {
        if (i === 0) return `${a.family}, ${a.given}`;
        if (i === last) return ` and ${a.given} ${a.family}`;
        return `, ${a.given} ${a.family}`;
      }).join("") + ".";
    }
    return `${authors[0].family}, ${authors[0].given}, et al.`;
  };

  if (item.type === "book") {
    switch (style) {
      case "apa":
        return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.publisher}.`;
      case "mla":
        return `${formatAuthorsMLA(item.authors)} ${item.title}. ${item.publisher}, ${item.year}.`;
      case "chicago":
        return `${formatAuthorsChicago(item.authors)} ${item.title}. ${item.publisher}, ${item.year}.`;
      default:
        return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.publisher}.`;
    }
  }
  
  switch (style) {
    case "apa":
      return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.journal}${item.volume ? `, ${item.volume}` : ""}${item.issue ? `(${item.issue})` : ""}${item.pages ? `, ${item.pages}` : ""}.${item.doi ? ` https://doi.org/${item.doi}` : ""}`;
    case "mla":
      return `${formatAuthorsMLA(item.authors)} "${item.title}." ${item.journal}${item.volume ? `, vol. ${item.volume}` : ""}${item.issue ? `, no. ${item.issue}` : ""}, ${item.year}${item.pages ? `, pp. ${item.pages}` : ""}.`;
    case "chicago":
      return `${formatAuthorsChicago(item.authors)} "${item.title}." ${item.journal} ${item.volume || ""}${item.issue ? `, no. ${item.issue}` : ""} (${item.year})${item.pages ? `: ${item.pages}` : ""}.`;
    default:
      return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.journal}.`;
  }
}

export async function searchAll(query) {
  if (query.match(/^10\.\d{4,}/)) {
    try {
      const result = await lookupByDOI(query);
      return result ? [result] : [];
    } catch {
      return [];
    }
  }
  
  if (query.match(/^[\d-]{10,17}$/)) {
    try {
      const result = await lookupByISBN(query);
      return result ? [result] : [];
    } catch {
      return [];
    }
  }
  
  const results = await Promise.allSettled([
    searchCrossRef(query),
    searchOpenLibrary(query),
  ]);
  
  const crossRefResults = results[0].status === "fulfilled" ? results[0].value : [];
  const openLibraryResults = results[1].status === "fulfilled" ? results[1].value : [];
  
  return [...crossRefResults, ...openLibraryResults];
}
