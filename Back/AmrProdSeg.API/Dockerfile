# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app --no-restore

# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
# libfontconfig1: SkiaSharp/QuestPDF (render de PDFs) · tzdata: hora local AR
RUN apt-get update \
    && apt-get install -y --no-install-recommends libfontconfig1 tzdata \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    TZ=America/Argentina/Buenos_Aires
EXPOSE 8080
ENTRYPOINT ["dotnet", "AmrProdSeg.API.dll"]
