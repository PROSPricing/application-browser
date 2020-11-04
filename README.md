# application-browser

Application Browser is an application that enables a user to continue to access specific Flash based applications that would traditionally have been access through the a web browser (e.g. Chrome, IE, Edge, Firefox, etc.).  The Application Browser still requires an installation of the Pepper Flash plugin on the user's local environment in order to render these specific Flash based applications.  

Application Browser was developed to provide PROS customers the ability to continue to use Sales Optimizer, Deal Optimizer, and Signal Demand even after mainstream browsers stop support Flash.   PROS commits to providing customers with a valid Sales Optimizer, Deal Optimizer, or Signal Demand maintenance contract periodic updates of Application Browser to resolve issues that prevent the customer from using features in their production environment.  These updates will be posted to Github for download.

In general, PROS will not provide a distribution of Pepper flash.  Obtaining a valid distribution of Pepper Flash will be the responsibility of the customer.  In addition, PROS will not provide any support or maintenance around Pepper Flash.

## Quick start

Clone and run this repo

```sh
npm install
npm start
```

Then follow the on-screen instructions on how to configure the application environments.

## config.json

Below is a sample configuration for the application

```javascript {
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
  ]
}
```

* flash - path - The path to the installed flashplayer - version - <i>(optional)</i> version number of the flashplayer
* environments - An array of environments that will be available on the launch page - id - unique id for the environment - url - fully qualified path to a website - label - The name of the link when shown in the UI
* develop - <i>(optional)</i> boolean value used to turn on development mode
* locale - <i>(optional)</i> forced override for the locale value. System locale will be used if not specified.

## How to Build

To build the installer, run the make command.

```sh
npm install
npm run make
```

Once complete the setup file will be in the `\out` folder.

## Frequently Asked Questions

[Frequently Asked Questions](assets/FAQ.docx)

## Changes

[Changes](CHANGES.txt)

## Contributors

[List of Contributors](CONTRIBUTORS)

## License

[GNU General Public License v3.0](LICENSE)
