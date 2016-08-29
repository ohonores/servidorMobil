function detectBrowser()
{
  var msg = "";

  var BrowserDetect =
  {
	init: function ()
	{
	  this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
	  this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
	  this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data)
	{
	  for (var i=0;i<data.length;i++)
	  {
		var dataString = data[i].string;
		var dataProp = data[i].prop;
		this.versionSearchString = data[i].versionSearch || data[i].identity;
		if (dataString)
		{
		  if (dataString.indexOf(data[i].subString) != -1)
		  return data[i].identity;
		}
		else if (dataProp)
		{
			return data[i].identity;
		}
	  }
	},
	searchVersion: function (dataString)
	{
	  var index = dataString.indexOf(this.versionSearchString);
	  if (index == -1) return;
	  return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
	  {
		string: navigator.userAgent,
		subString: "Chrome",
		identity: "Chrome"
	  },
	  {
		string: navigator.userAgent,
		subString: "OmniWeb",
		versionSearch: "OmniWeb/",
		identity: "OmniWeb"
	  },
	  {
		string: navigator.vendor,
		subString: "Apple",
		identity: "Safari"
	  },
	  {
		prop: window.opera,
		identity: "Opera"
	  },
	  {
		string: navigator.vendor,
		subString: "iCab",
		identity: "iCab"
	  },
	  {
		string: navigator.vendor,
		subString: "KDE",
		identity: "Konqueror"
	  },
	  {
		string: navigator.userAgent,
		subString: "Firefox",
		identity: "Firefox"
	  },
	  {
		string: navigator.vendor,
		subString: "Camino",
		identity: "Camino"
	  },
	  { // for newer Netscapes (6+)
		string: navigator.userAgent,
		subString: "Netscape",
		identity: "Netscape"
	  },
	  {
		string: navigator.userAgent,
		subString: "MSIE",
		identity: "Explorer",
		versionSearch: "MSIE"
	  },
	  {
		string: navigator.userAgent,
		subString: "Gecko",
		identity: "Mozilla",
		versionSearch: "rv"
	  },
	  { // for older Netscapes (4-)
		string: navigator.userAgent,
		subString: "Mozilla",
		identity: "Netscape",
		versionSearch: "Mozilla"
	  }
	],
	dataOS : [
	  {
		string: navigator.platform,
		subString: "Win",
		identity: "Windows"
	  },
	  {
		string: navigator.platform,
		subString: "Mac",
		identity: "Mac"
	  },
	  {
		string: navigator.platform,
		subString: "Linux",
		identity: "Linux"
	  }
	]
  };

  //Activates code to detect determine what Browser, Version, and OS you have
  BrowserDetect.init();

  //Print Statements to see your Browser type and Version
  /*document.write("<p><em>Script 2 Start</em><br />");
  document.write("Browser: " + BrowserDetect.browser + "<br />");
  document.write("Version: " + BrowserDetect.version + "<br />");
  document.write("Operating System: " + BrowserDetect.OS + "<br />");
  document.write("<em>Script 2 End</em></p><br />");*/

  /* This list defines what Browser type and their Versions belong in what category.
   *
   * "goodBrowsers" list is not used in any checks.
   * "warn1Browsers" are used to see if a simple message should be displayed.
   *      If found here, no other checks will be preformed.
   * "warn2Browsers" are used to see if a big message should be displayed.
   *      If found here, then it was not found in the "warn1Browsers" list.
   */

  //Good Browsers - No message
  var goodBrowsers =
  [
	["Explorer",["unknown"]],
	["Firefox",["unknown"]],
	["Safari",["unknown"]],
	["Chrome",["unknown"]]
  ];

  //Warning level 1 browsers - simple message
  var warn1Browsers =
  [
	["Mozilla",["unknown"]],
	["OmniWeb",["unknown"]],
	["Opera",["unknown"]],
	["iCab",["unknown"]],
	["Konqueror",["unknown"]],
	["Camino",["unknown"]],
	["Netscape",["unknown"]],
	["Firefox",[4]],
	["Firefox",[7]],
	["Firefox",[8]],
	["Explorer",[6]],
	["Chrome",[14]],
	["Chrome",[15]],
	["Safari",[2]],
	["Safari",[3]]
  ];

  /* This checks your Browser against the lists.
   * NOTE: The "goodBrowsers" list is not used in any checks.
   */
  var badBrowser1 = false;

  for(i = 0; i < warn1Browsers.length; i++)
  {
	if(warn1Browsers[i][0] == BrowserDetect.browser)
	{
	  for(j = 0; j < warn1Browsers[i][1].length; j++)
	  {
		if(warn1Browsers[i][1][j] == BrowserDetect.version || warn1Browsers[i][1][j] == "unknown")
		{
		  badBrowser1 = true;
		  break;
		}
	  }

	  if(badBrowser1 == true)
	  {
		break;
	  }
	}
  }
  /* If a bad browser was found, simple or big messages will be displayed
   *
   * If your browser was not listed in any list, nothing will be triggered.
   */
  return BrowserDetect;
}
