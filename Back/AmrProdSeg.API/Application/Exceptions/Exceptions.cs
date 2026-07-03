namespace AmrProdSeg.API.Application.Exceptions;

/// <summary>Error de negocio conocido — se devuelve al cliente como 400.</summary>
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

/// <summary>Recurso no encontrado — se devuelve al cliente como 404.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}
