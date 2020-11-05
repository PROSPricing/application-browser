# Release Notes
- [How to Install on Windows](#How-to-Install-on-Windows)
  - [Using Application Browser msi artifact](#Using-Application-Browser-msi-artifact)
  - [Using Application Browse exe artifact](#Using-Application-Browse-exe-artifact)
- [How to Configure](#How-to-Configure)
- [Changes](#Changes)
  - [4.0.1](#4.0.1)
- [Known Issues](#Known-Issues)

## How to Install on Windows

There are two options to install Application Browser: 
1.	ApplicationBrowser-<version>.msi
2.	ApplicationBrowser-<version>-setup.exe

### Using Application Browser msi artifact
If you have installed any previous versions of Application Browser, make a backup of your config.json file and uninstall any existing versions of Application Browser.

•	Run the “ApplicationBrowser-<version>.msi” file.
- While the install in running, a status window will display.

•	Once installation is complete:
- ApplicationBrowser will be installed under C:\Program Files (x86)\Application Browser\
- Shortcuts should now be available on the windows start menu. You may also want to right-click this icon in the application bar to pin it.
- You will need to configure the application environments. The application will prompt the user if the configuration file is missing or is invalid.

### Using Application Browse exe artifact
While the install in running, a loading icon will display.

NOTE: The application will open as part of the install process. It may automatically restart once before it finishes. 

•	In the event of an error, you may not have write permission set on the install directory. 
- Go to C:\Users\<username>\AppData\Local
- If the ApplicationBrowser folder does not exist, create it.
- Right-click the new ApplicationBrowser folder, click on permissions and deselect the Read-only checkbox.
 -	Apply the changes and rerun the install.

•	Now that the install is complete:
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
* environments (required) - An array of environments that will be available on the initial page. Each environment has the following properties:
* id (required) – A unique id for the environment.
* url (required) – A fully qualified path to a website. When configuring PPSS URLs, be sure to configure the fully qualified path to the login page. A typical PPSS configuration will look like https://server-alpha:8123/PPSS/PPSS?control=loginPage
* label (required) - The name of the link that will be shown in the UI. This label is also used in the title upon opening an environment
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
## Changes

### 4.0.1
 - PPSS-39016 Application Browser is not displaying special characters and application version correctly.
 - PPSS-39419 Application Browser doesn't display environment configuration when is opened using VPN client.

## Known Issues
- PPSS-35717 When using an ID value with a blank space the PPSS login page is not displayed.
- PPSS-38383 Excel export file lacks name and extension using Application Browser. 

### Workaround for PPSS-38383
For users that are experiencing problems with lack of extension when exporting a file, please open Windows explorer and check the File name extensions box to unhide the extension.