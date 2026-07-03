namespace AmrProdSeg.API.Application.Mapping;

/// <summary>
/// Convierte una colección de objetos tipados en filas genéricas
/// (columna→valor) para alimentar las exportaciones a PDF/Excel.
/// </summary>
public static class RowMapper
{
    public static List<Dictionary<string, object?>> ToRows<T>(IEnumerable<T> items)
    {
        var props = typeof(T).GetProperties();
        var filas = new List<Dictionary<string, object?>>();
        foreach (var item in items)
        {
            var fila = new Dictionary<string, object?>(props.Length);
            foreach (var p in props)
                fila[p.Name] = p.GetValue(item);
            filas.Add(fila);
        }
        return filas;
    }
}
