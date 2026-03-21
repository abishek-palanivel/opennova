package com.opennova.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.oauth2.Oauth2;
import com.google.api.services.oauth2.model.Userinfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Service
public class GoogleOAuthService {

    @Value("${google.oauth2.client-id}")
    private String clientId;

    @Value("${google.oauth2.client-secret}")
    private String clientSecret;

    @Value("${google.oauth2.redirect-uri}")
    private String redirectUri;

    private static final List<String> SCOPES = Arrays.asList(
        "openid",
        "email",
        "profile"
    );

    private GoogleAuthorizationCodeFlow getFlow() {
        GoogleClientSecrets.Details web = new GoogleClientSecrets.Details();
        web.setClientId(clientId);
        web.setClientSecret(clientSecret);

        GoogleClientSecrets clientSecrets = new GoogleClientSecrets();
        clientSecrets.setWeb(web);

        return new GoogleAuthorizationCodeFlow.Builder(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            clientSecrets,
            SCOPES)
            .setAccessType("offline")
            .setApprovalPrompt("force")
            .build();
    }

    public String getAuthorizationUrl() {
        GoogleAuthorizationCodeFlow flow = getFlow();
        return flow.newAuthorizationUrl()
            .setRedirectUri(redirectUri)
            .build();
    }

    public GoogleUserInfo getUserInfo(String authorizationCode) throws IOException {
        GoogleAuthorizationCodeFlow flow = getFlow();
        
        GoogleTokenResponse tokenResponse = flow.newTokenRequest(authorizationCode)
            .setRedirectUri(redirectUri)
            .execute();

        // Create credential from token response
        com.google.api.client.auth.oauth2.Credential credential = 
            flow.createAndStoreCredential(tokenResponse, "user");

        Oauth2 oauth2 = new Oauth2.Builder(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            credential)
            .setApplicationName("OpenNova")
            .build();

        Userinfo userInfo = oauth2.userinfo().get().execute();

        return new GoogleUserInfo(
            userInfo.getId(),
            userInfo.getEmail(),
            userInfo.getName(),
            userInfo.getPicture(),
            userInfo.getVerifiedEmail()
        );
    }

    public static class GoogleUserInfo {
        private final String id;
        private final String email;
        private final String name;
        private final String picture;
        private final Boolean verifiedEmail;

        public GoogleUserInfo(String id, String email, String name, String picture, Boolean verifiedEmail) {
            this.id = id;
            this.email = email;
            this.name = name;
            this.picture = picture;
            this.verifiedEmail = verifiedEmail;
        }

        public String getId() { return id; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getPicture() { return picture; }
        public Boolean getVerifiedEmail() { return verifiedEmail; }
    }
}