FROM mcr.microsoft.com/mssql/server:2017-latest-ubuntu

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]