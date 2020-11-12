# Release Notes
- [How to Install on Windows](#How-to-Install-on-Windows)
  - [Using Application Browser msi artifact](#Using-Application-Browser-msi-artifact)
  - [Using Application Browser exe artifact](#Using-Application-Browser-exe-artifact)
- [How to Configure](#How-to-Configure)
- [Configuring the Flash Player](#Configuring-the-Flash-Player)
- [Configuring PPSS with a “Load Balancer”](#Configuring-PPSS-with-a-“Load-Balancer”)
- [Deep Linking](#Deep-Linking)
- [Launch the Application Browser with an ID parameter](#Launch-the-Application-Browser-with-an-ID-parameter)
- [How to Configure PPSS DO Email Approval](#How-to-Configure-PPSS-DO-Email-Approval)
- [How to enable servers to automatic NTLM authentication](#How-to-enable-servers-to-automatic-NTLM-authentication)
- [Changes](#Changes)
  - [4.0.1](#4.0.1)
  - [4.0.2](#4.0.2)
- [Known Issues](#Known-Issues)

## How to Install on Windows

There are two options to install Application Browser: 
1. ApplicationBrowser-<version>.msi
2. ApplicationBrowser-<version>-setup.exe

### Using Application Browser msi artifact
If you have installed any previous versions of Application Browser, make a backup of your config.json file and uninstall any existing versions of Application Browser.

• Run the “ApplicationBrowser-<version>.msi” file.
- While the install in running, a status window will display.

• Once installation is complete:
- ApplicationBrowser will be installed under C:\Program Files (x86)\Application Browser\
- Shortcuts should now be available on the windows start menu. You may also want to right-click this icon in the application bar to pin it.
- You will need to configure the application environments. The application will prompt the user if the configuration file is missing or is invalid.

### Using Application Browser exe artifact
While the install in running, a loading icon will display.

NOTE: The application will open as part of the install process. It may automatically restart once before it finishes. 

• In the event of an error, you may not have write permission set on the install directory. 
- Go to C:\Users\<username>\AppData\Local
- If the ApplicationBrowser folder does not exist, create it.
- Right-click the new ApplicationBrowser folder, click on permissions and deselect the Read-only checkbox.
- Apply the changes and rerun the install.

• Now that the install is complete:
- Shortcuts should now be available on the desktop. You may also want to right-click this icon in the application bar to pin it.
- Unless the application has been preconfigured, you will need to configure the application environments. The application will prompt the user if the configuration file is missing or is invalid.

## How to Configure
After the client is installed, you may get a prompt that config.json file is missing.
* If ApplicationBrowser-<version>.msi was used to install Application Browser, place the config.json file under C:\Program Files (x86)\Application Browser
* If ApplicationBrowser-<version>-setup.exe was used to install Application Browser, place the config.json file under C:\Users\<username>\AppData\Local\ApplicationBrowser\app-<version>
Create this file and populate it with environment URLs. Here is a sample configuration file.
```
{
  "flash":
  {
    "path":"C:\\Windows\\System32\\Macromed\\Flash\\pepflashplayer64_28_0_0_137.dll"
  },

 "environments":
  [
    {
      "id": "test",
      "url": "https://www.google.it",
      "label": "Test"
    }, {
      "id": "sandbox",
      "url": "https://us.yahoo.com/",
      "label": "Sandbox"
    }, {
      "id": "production",
      "url": "https://www.facebook.com",
      "label": "Production"
    }
  ],

  "whenUrl": [
    {
      "endsWith": "PPSS/PPSS",
      "thenAppend": "?control=loginPage"
    }
  ]
}
```

* flash > path (optional) - The path to the installed pepper flashplayer.dll file. The application will attempt to use this path to the Pepper Flash Player. If not found, the application will attempt to find an installed version.
* environments `(required)` - An array of environments that will be available on the initial page. Each environment has the following properties:
  * id `(required)` – A unique id for the environment.
  * url `(required)` – A fully qualified path to a website. When configuring PPSS URLs, be sure to configure the fully qualified path to the login page. A typical PPSS configuration will look like https://server-alpha:8123/PPSS/PPSS?control=loginPage
  * label `(required)` - The name of the link that will be shown in the UI. This label is also used in the title upon opening an environment
* develop (optional) - A Boolean value used to turn on development mode. This is not recommended for production installations.
* locale (optional) – A locale value that will override the system locale. This is not recommended for production installations.
* whenUrl (optional) – A set of conditions used to update a URL when opened from the main window.
  * endsWith – A string to look for in the URL when loaded
  * thenAppend – A string to append to the end of a URL if the endsWidth string is found.

After the application is successfully opened, it creates the launchpage-config.json file in the user’s folder. This file has the hide property for each configured environment that indicates if this environment is hidden or not. The user will be able to override this value within the running application. Here is a sample of this file:
```
{
   "settings":[
      {
         "ref":"test",
         "hide":false
      },
      {
         "ref":"sandbox",
         "hide":false
      },
      {
         "ref":"production",
         "hide":false
      }
   ]
}
```
## Configuring the Flash Player
If you see the message   `Couldn't load plugin.`, then the Pepper Flash Player could not be found. This means an installed Pepper Flash Player could not be found and flash path in the config.json file is either missing or invalid.

## Configuring PPSS with a “Load Balancer”
When PPSS is configured to a load balancer, the resulting path to PPSS is generally the root path to the servlet often ending with “/PPSS/PPSS”. While the load balancer could be configured to end with “/PPSS/PPSS?control=loginPage”, this may not be desirable while supporting a standard browser as well as an application browser. To get around this, the Application Browser can be configured to automatically redirect when it sees a particular page. The following configuration can be used to do this.
```
  "whenUrl": [
    {
      "endsWith": "PPSS/PPSS",
      "thenAppend": "?control=loginPage"
    }
  ],
```
## Deep Linking
The application browser is configured to open links with the **appb://** protocol. To successfully use this feature, two things must be configured:
- The protocol must be immediately followed by a reference URL such as  
**appb://http://server-alpha:8123/PPSS/PPSS?control=foobar&abc=123**
- The scheme, host, and port (if applicable) of the fully qualified URL must match at least one configured environment’s scheme, host, and port. In the example above, only the http://server-alpha:8123 portion of the link will be tested against configured environments.
```
 appb://http://server-alpha:8123/PPSS/PPSS?control=foobar&abc=123
 └──┬──┘└───┬──┘└────┬────┘└─┬─┘└────┬────┘└─────────┬──────────┘
protocol scheme     host    port   servlet       query string
        └───────────────────────────┬───────────────────────────┘
                              Reference URL
```
## Launch the Application Browser with an ID parameter
Application browser has the option to pass ID parameter to Application Browser.exe and it will launch the Login Page for the environment matching with that ID. To use this feature, you must create a shortcut of Application Browser. Once created the shortcut, edit the properties of the shortcut file setting in the target section the ID value to be configured. For instance, if the ID value to be configured is the DEV-app01, it must be looks like: "C:\Program Files (x86)\Application Browser\Application Browser.exe" DEV-app01:

## How to Configure PPSS DO Email Approval
Email sent from PPSS will default to provide links for web browsers. To direct the email to open the Application Browser, the PPSS application must be configured to send email links with the pros-app protocol.

To configure DO Email Approval, follow the steps below:
- From the PPSS application, open the **Tools > Configure > System** Parameters page.  
***Note: This page may require specific access rights to view and may also be configured to show up in a different location on the menu.***
- Locate the system parameter with “Subsystem” set to “PRICING” and “Parameter” set to “EMAIL_APP_HTTP_ADDRESS”.  The default value for this item is “DEFAULT”.
- Change the value to include the protocol, scheme, host, port number, and servlet name. Following our example above, the value should be set to
```
    appb://http//server-alpha:8123/PPSS/PPSS
    └─┬─┘  └─┬─┘  └────┬────┘  └┬┘  └──┬──┘ 
  protocol scheme     host     port  servlet
```
## How to enable servers to automatic NTLM authentication
To enable servers to use automatic NTLM authentication add the **authServerWhitelist** property in the config.json file with a comma sepparated list of the servers. For example:

- "authServerWhitelist": "www.alpha.com,*beta.com"

Without * prefix the URL has to match exactly. If you use only **"*"** wildcard, this integration will be globally enabled. If you don't want this integration to be turned on, remove the property from the config.json file.

## Changes

### 4.0.1
 - PPSS-39016 Application Browser is not displaying special characters and application version correctly.
 - PPSS-39419 Application Browser doesn't display environment configuration when is opened using VPN client.

### 4.0.2
 - PPSS-38194 Application Browser error 401 when using VPN client.
 - PPSS-40347 Update readme file with FAQ and release notes for Application Browser.
 - PPSS-39787 Remove spaces and concatenate version to the installer name for Application Browser.

## Known Issues
- PPSS-35717 When using an ID value with a blank space the PPSS login page is not displayed.
- PPSS-38383 Excel export file lacks name and extension using Application Browser. 

### Workaround for PPSS-38383
For users that are experiencing problems with lack of extension when exporting a file, please open Windows explorer and check the File name extensions box to unhide the extension.