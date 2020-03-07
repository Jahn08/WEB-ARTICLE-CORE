FROM mcr.microsoft.com/dotnet/core/sdk:2.2 AS net-build
WORKDIR /source

COPY /WebArticleLibrary.Model/WebArticleLibrary.Model.csproj ./WebArticleLibrary.Model/
RUN dotnet restore ./WebArticleLibrary.Model/WebArticleLibrary.Model.csproj
COPY /WebArticleLibrary.Model ./WebArticleLibrary.Model

COPY /WebArticleLibrary/WebArticleLibrary.csproj ./WebArticleLibrary/
RUN dotnet restore ./WebArticleLibrary/WebArticleLibrary.csproj

COPY /WebArticleLibrary ./WebArticleLibrary
RUN dotnet publish ./WebArticleLibrary -c release -o /app

FROM node:8.11 AS node-build
WORKDIR /app

COPY /WebArticleLibrary/*.json ./WebArticleLibrary/
COPY /WebArticleLibrary/wwwroot ./WebArticleLibrary/wwwroot/

RUN cd ./WebArticleLibrary && npm install

RUN npm install -g typescript
RUN tsc --build ./WebArticleLibrary/tsconfig.json

FROM mcr.microsoft.com/dotnet/core/sdk:2.2
WORKDIR /app

COPY 1.pfx ./

COPY --from=net-build /app .
COPY --from=node-build /app .

EXPOSE 5443
ENTRYPOINT ["dotnet", "WebArticleLibrary.dll"]