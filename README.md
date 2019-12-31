
![alt text](https://github.com/Jahn08/Angular-MVC-Application/blob/master/WebArticleLibrary/images/indexIcon.ico)

# Web-Article-Core

A web project using the AngularJS framework and based on the functionality of [Web Article Library](https://github.com/Jahn08/WEB-ARTICLE-LIBRARY) rewritten with .NET Core on the server side and Type Script on the client.
It implements simple logic for creating, storing and maintaining articles. Some features:

* Authentication (through the session storage and cookies)
* A simple role model
* An administration module
* User settings
* Rating articles, leaving comments and making complaints
* A notification system (SignalR)
* SQL as a default DB model provider (Entity Framework) ([read more](#headDatabase))

### Role model

Administrators can review articles if they have taken them over as assignment. Approving the articles makes them available for other users to read.

Administrators are also responsible for dealing with complaints (either about comments or articles).

Administrators can ban other users or make them into administrators or conversely into regular users.

## Installing / Getting started

The application is dependent on .NET Core 2.2 ([read more](#headPrerequisites)) along with SQL Server ([read more](#headSettingUpDev)).

The first user registered in the application will be granted administrative rights.
## Developing

### Built with

* [Entity Framework Core 2.2.6](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore/2.2.6)
* [Angular 1.6.4](https://www.nuget.org/packages/AngularJS.Core/1.6.4)
* [Bootstrap 3.4.1](https://www.nuget.org/packages/bootstrap/3.4.1)
* [Font Awesome 4.7.0](https://www.nuget.org/packages/FontAwesome/4.7.0)
* [jQuery 2.0.3](https://www.nuget.org/packages/jQuery/2.0.3)
* [Bootstrap-wysiwyg 1.04](https://www.nuget.org/packages/Bootstrap.Wysiwyg/1.0.4)
* [Hotkeys 0.8](https://www.nuget.org/packages/jQuery.Hotkeys/0.8.0.20131227)
* [SignalR 2.4.1](https://www.nuget.org/packages/Microsoft.AspNet.SignalR/2.2.2)
* [Select2](https://www.nuget.org/packages/Select2.js/4.0.3)

### <a name="headPrerequisites"></a>Prerequisites

* [Microsoft .NET Core SDK 2.2.207](https://dotnet.microsoft.com/download/dotnet-core/2.2)
* The project was developed in Visual Studio Code ([the product page](https://code.visualstudio.com/))

### <a name="headSettingUpDev"></a>Setting up Dev

The developer computer has to have an access to MS SQL Server installed to deploy the database ([read more](#headDatabase)).   

### Deploying / Publishing



## <a name="headConfiguration"></a>Configuration

appsettings.json lying in the root catalogue of the main project serves as the general file for configuration. The next parameters can be set there: 
* *Host, Port, UserName, Password* in the *SMTP* section for configuring a mail address which will be used to send messages to the users when registering, resetting password, changing email addresses or their statuses being altered
* *AboutUs, Fax, Phone, Mail, YoutubeLink, FacebookLink* in the *ContactInfo* section for storing additional contact information shown in the bottom section of the site

There is also one more imperative parameter in the same file, but in a section *ConnectionStrings*, where a connection string to the database should be added (or changed).

## Api Reference

The api module is available through the base url address by adding the api postfix and a respective controller along with a method and its parameters. For instance, http://localhost/WebArticleLibrary/api/Article/GetArticleTitles. The external public api methods (unnecessary parameters are marked with *?*):
* **POST Authentication/LogIn** with an object *{ name, password }*, returns a logged in user's data *{ status, id, name, firstName, lastName, patronymicName, email, photo, showPrivateInfo, insertDate }*
* **POST Authentication/Register** with the object *{ name, password, firstName, lastName, patronymicName?, email }*
* **GET Authentication/LogOut**
* **GET Authentication/Confirm** with a parameter *confirmationId*, which is a GUID number formed and sent in a link to a new user's email when registering in the application
* **GET ContactInfo** returns the company's contact data *{ fax, phone, mail,	youtubeLink, facebookLink }* ([how to configure](#headConfiguration))
* **GET ContactInfo/AboutUs** returns a short description from the AboutUs page *{ aboutUs }*
* **GET Article/Categories** returns an array of names of default article categories existing as constant strings in the system
* **GET Article/Titles** produces two dictionaries and an object *{ articles: { id, authorId, name, tags, insertDate, estimate }, userNames: [] }*, where *userNames* is a dictionary with user identificators as keys along with their names as values
* **GET Article/{id}** accepts two parameters: *id, userId?*. *userId* indicates that the outcome should contain additional information such as related comments, photos, current article rating. The result is *{ article: { id, authorId, assignedToId, name, description, tags, insertDate, status, content }, updatedDate, comments: [{ id, authorId, responseToId, articleId, content, insertDate, status }], userNames: [], userPhotos: [], estimate, curEstimate }*, where *userNames* and *userPhotos* are dictionaries with user identificators as keys along with the respective objects as values
* **GET Article** searches for articles by means of the next parameters: *author?, tags?* (a part of the string containing categories), *text?* (it's either a part of the description or name field), *dateStart?, dateEnd?* (a date range of when articles were created), *page = 1* (a result page number; the number of items per page is the constant of 10), *colIndex = 7* (an index for a sorting column; possible values: NAME = 0, AUTHOR = 1,	TAGS = 2,	ASSIGNED_TO = 3, STATUS = 4, TEXT = 5, ID = 6, DATE = 7), *asc=false* (a direction of sorting results: ascending or otherwise descending). It returns the object *{ articles: [{ id, name, tags, insertDate, status, description, authorId }], articleCount, pageLength, userNames: [], estimates: [] }*, whereas *userNames* and *estimates* are dictionaries with user identificators as keys along with the respective objects as values
* **POST UserInfo/ReplacePassword** accepts an object *{ newPassword, confirmationId }*
* **GET UserInfo/ResetPassword** requires a parameter *email* as an email address where a message for resetting password will be sent if the respective user exists in the database
* **GET UserInfo/ConfirmEmail** requires a parameter *confirmationId*

## <a name="headDatabase"></a>Database

The project database is based upon [SQL Server 2012](https://www.microsoft.com/en-US/download/details.aspx?id=29062); later versions of the product are also possible to make use of.

The database model is built with Entity Framework 6.1.3. When a database being created automatically, a user account under which the web application works has to have proper rights for the action on the respective SQL Server (the dbcreator role). For instance, if the application registered with the ApplicationPoolIdentity credentials, then such a user should be added to the logins of the SQLServer: for DefaultAppPool the name is *IIS APPPOOL\DefaultAppPool*.

There are 8 tables altogether:
* **User** stores users' data such as: preferences, email, personal data, etc.
* **Article** keeps all information related to articles
* **UserComment, UserComplaint, UserEstimate** are all connected to both of the mentioned tables and contain respective information (comments for articles, complaints related to either an article or a comment, ratings for articles)
* **Amendment** stores amendments corresponding to an article being reviewed
* **ArticleHistory** contains descriptions of all events related to a particular article
* **UserNotification** is made up of data related to events from ArticleHistory and connected to a particular user (for instance, notifications for administrators about a new article being waited for a review)

![alt text](https://github.com/Jahn08/WEB-ARTICLE-CORE/blob/master/DB_Diagram.jpg "A database diagram")
