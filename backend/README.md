

```
/api-v1/authenticate
    GET - Attempts to login and create a new session
        AUTHORIZATION
            Everyone - Full access 
            Member - no access
            Owner - n/a
        PARAMS 
            {String} username - The username used to authenticate
            {String} password - The password used to authenticate
            {String} [key] - The email verification key for first time login
        RESPONSE CODES
            200 - ok, The user has successfully authenticated
            400 - bad request, Missing the username, password, or email verification key
            401 - unauthorized, Failed one or more of the verification methods
            429 - rate limited, Too many attempts to login
            403 - forbidden, The user is already logged in
        RESPONSE BODY
            {String} profileId - The ID for redirecting to the users profile
            {String[]} errors - Any errors encountered while processing the request
    POST - Creates a new auth-user AND user profile
        AUTHORIZATION
            Everyone - Full access
            Member - no access
            Owner - n/a
        PARAMS
            {String} username - The name used to login and the display name
            {String} email - The email to associate with the account
            {String} password - The password to be used for logging into this account
        RESPONSE CODES
            200 - ok, The user has been created
            400 - bad request, Missing the username, email, or password
            403 - forbidden, The user is already logged in
            409 - conflict, A user with this name or emails address already exists
            422 - unprocessable, The username, email, or password do not meet the format or complexity requirements
            429 - rate limited, Too many attempts to create a new user
            500 - Failed to save changes to the database
        RESPONSE BODY
            {String} user - JSON representation of the user
            {String[]} errors - Any errors encountered while processing the request
    PUT - Updates an authentication user
        AUTHORIZATION
            Everyone - No access
            Member - NO access
            Owner - Limited access
        PARAMS 
            {String} [oldPassword] - The current password being used to authenticate
            {String} [newPassword] - The password to update the authentication user with
        RESPONSE CODES
            200 - ok, The user has successfully been updated
            400 - bad request, neither a username or password were provided to update
            401 - unauthorized, The user does not exist or password does not match
            403 - forbidden, User is not logged in
            429 - rate limited, Too many attempts to create a new use
        RESPONSE BODY
            {String} profileId - The ID for redirecting to the users profile
            {String[]} errors - Any errors encountered while processing the request
    DELETE - Deactivates the user
        AUTHORIZATION
            Everyone - No access
            Member - No access
            Owner - Limited access
        PARAMS
            {String} reason, An explanation of why the account is being deactivated
            {Number} code, A deactivation code representing a reason
        RESPONSE CODES
            200 - ok, The user has been deactivated
            400 - bad request, Missing the reason or code
            401 - unauthorized, Do not have permissions to make these changes
            403 - forbidden, The account is disabled
            415 - unsupported, Unable to parse the user JSON
            422 - unprocessable, No matching user with this id
            429 - rate limited, Too many attempts to create a new use
        RESPONSE BODY
            {String[]} errors - Any errors encountered while processing the request  

/api-v1/reset-password
    POST - Attempts to reset a password
        AUTHORIZATION
            Everyone - Full access
            Member - no access
            Owner - n/a
        PARAMS
            {String} username - The username of the account to reset
            {String} email - The email which this account is associated with
            {String} key - The reset key generated to the users email address
            {String} password - The new password to use for this account
        RESPONSE CODES
            200 - ok, The user has been updated with the new password
            400 - bad request, Missing the username, email, key, or password
            403 - forbidden, The account is disabled and may not be reset
            403 - forbidden, The user is already logged in
            422 - unprocessable, no matching username, email, key combination found
            429 - rate limited, Too many attempts to create a new use
        RESPONSE BODY
            {String[]} errors - Any errors encountered while processing the request

/api-v1/profile
    GET - Retrieves the user by id
        AUTHORIZATION
            Everyone - No access
            Member - Limited access
            Owner - Full access
        RESPONSE CODES
            200 - ok, Successfully retrieved the user details
            422 - unprocessable, No matching user with this id
        RESPONSE BODY
            {String} profile - JSON representation of the user
            {String[]} errors - Any errors encountered while processing the request 
    PUT - Updates the user
        AUTHORIZATION
            Everyone - No access
            Member - No access
            Owner - Full access
        PARAMS
            {String} user - a JSON representation of the updated user
        RESPONSE CODES
            200 - ok, The user has been updated
            400 - bad request, Missing the user
            401 - unauthorized, Do not have permissions to make these changes
            403 - forbidden, The account is disabled
            415 - unsupported, Unable to parse the user JSON
            422 - unprocessable, No matching user with this id
        RESPONSE BODY
            {String} profile - JSON representation of the user
            {String[]} errors - Any errors encountered while processing the request   


/api-v1/clusters/:id
    GET - Retrieves the cluster by the provided id
        AUTHORIZATION
            Everyone - Limited access 
            Member - full access
            Owner - full access
        RESPONSE CODES
            200 - ok, Successfully retrieved the cluster details
            422 - unprocessable, No matching cluster with this id
        RESPONSE BODY
            {String} cluster - JSON representation of the cluster
            {String[]} errors - Any errors encountered while processing the request
    POST - Creates a new cluster
        AUTHORIZATION
            Everyone - no access 
            Member - full access 
            Owner - n/a
        PARAMS
            {String} name
            {Boolean} pvp
            {('STEAM' | 'PLAYSTATION' | 'XBOX')} platform
            {('NITRADO' | 'SELF_HOSTED' | 'OTHER')} hostType
            {String} [configId]
            {String} [description]
            {Boolean} [public]
            {Date} [lastWipe]
            {Date} [nextWipe]
            {String} [body]
        RESPONSE CODES
            200 - ok, The cluster has been created
            400 - bad request, Missing ta required parameter 
            401 - unauthorized, Failed one or more of the verification methods
            409 - conflict, A cluster with the name already exists
            422 - unprocessable, The parameters did not meet the requirements
        RESPONSE BODY
            {String} cluster - JSON representation of the cluster
            {String[]} errors - Any errors encountered while processing the request
    PUT - Updates the cluster with the provided changes
        AUTHORIZATION
            Everyone - no access
            Member - no access
            Owner - full access
        PARAMS
            {String} cluster - The JSON representation of the updated cluster
        RESPONSE CODES
            200 - ok, The cluster was updated
            400 - bad request, Missing the cluster parameter
            401 - unauthorized, Failed one or more of the verification methods
            403 - forbidden, The cluster is disabled and may not be modified
            415 - unsupported, Unable to parse the cluster JSON
            422 - unprocessable, No matching cluster with this id
        RESPONSE BODY
            {String} cluster - JSON representation of the cluster
            {String[]} errors - Any errors encountered while processing the request
    DELETE - Deactivates the cluster
        AUTHORIZATION
            Everyone - no access
            Member - no access
            Owner - full access
        PARAMS
            {String} reason, An explanation of why the cluster is being deactivated
            {Number} code, A deactivation code representing a reason
        RESPONSE CODES
            200 - ok, The cluster has been deactivated
            400 - bad request, Missing the reason or code
            401 - unauthorized, Do not have permissions to make these changes
            403 - forbidden, The cluster is already deactivated
            422 - unprocessable, No matching cluster with this id   
        RESPONSE BODY
            {String[]} errors - Any errors encountered while processing the request

/api-v1/game-config/:id
    GET - Retrieves the game configuration by the provided id
        AUTHORIZATION
            Everyone - Limited access 
            Member - Limited access+
            Owner - full access
        PARAMS
            {String} id - The id of the configuration file to retrieve
            {String} category - The configuration file section to retrieve
        RESPONSE CODES
            200 - ok, Successfully retrieved the game config details
            422 - unprocessable, No matching game config with this id
        RESPONSE BODY
            {String} config - JSON representation of the game configuration
            {String[]} errors - Any errors encountered while processing the request
    POST - Creates a new game configuration 
        AUTHORIZATION
            Everyone - no access 
            Member - full access 
            Owner - n/a
        PARAMS
            {String} name - The friendly name for the configuration
            {String} config1 - The game.ini configuration string
            {String} config2 - The GameUserSettings.ini configuration string
        RESPONSE CODES
            200 - ok, The game config has been parsed and saved
            400 - bad request, Missing one or more of the required parameters 
            401 - unauthorized, Failed one or more of the verification methods
            409 - conflict, A configuration with this name already exists
            422 - unprocessable, The parameters did not meet the requirements
        RESPONSE BODY
            {String} cluster - JSON representation of the game configuration
            {String[]} errors - Any errors encountered while processing the request
    PUT - Updates the game configuration with the provided changes
        AUTHORIZATION
            Everyone - no access 
            Member - no access
            Owner - full access
        PARAMS
            {String} config - The updated JSON game configuration
        RESPONSE CODES
            200 - ok, The game configuration was updated
            400 - bad request, Missing the config parameter
            401 - unauthorized, Failed one or more of the verification methods
            415 - unsupported, Unable to parse the config JSON
            422 - unprocessable, No matching config with this id
        RESPONSE BODY
            {String} cluster - JSON representation of the game configuration
            {String[]} errors - Any errors encountered while processing the request
    DELETE - Deactivates the game configuration
        AUTHORIZATION
            Everyone - no access
            Member - no access
            Owner - full access
        PARAMS
            {String} reason, An explanation of why the config is being deleted
            {Number} code, A deactivation code representing a reason
        RESPONSE CODES
            200 - ok, The configuration has been deleted
            400 - bad request, Missing the reason or code
            401 - unauthorized, Do not have permissions to make these changes
            422 - unprocessable, No matching cluster with this id  
        RESPONSE BODY
            {String[]} errors - Any errors encountered while processing the request
```