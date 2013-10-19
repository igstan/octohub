package controllers

import play.api._
import play.api.mvc._
import play.api.libs.ws._
import play.api.libs.json._
import play.api.libs.concurrent.Execution.Implicits._

object Actions extends Controller {
  val clientId = config("github.oauth.client.id")
  val clientSecret = config("github.oauth.client.secret")
  val redirectUri = config("application.url") + "/oauth"
  val scopes = "user,repo,notifications"
  val connectUrl = s"https://github.com/login/oauth/authorize?client_id=$clientId&redirect_uri=$redirectUri&scope=$scopes"

  def index = Action {
    Ok(views.html.index(connectUrl))
  }

  def account = Action { implicit request =>
    val oauth = flash.get("oauth").getOrElse("null")
    Ok(views.html.account(oauth))
  }

  def oauthCallback(code: String) = Action.async {
    WS.url("https://github.com/login/oauth/access_token")
      .withHeaders("Accept" -> "application/json")
      .post(Map(
        "client_id"     -> Seq(clientId),
        "client_secret" -> Seq(clientSecret),
        "redirect_uri"  -> Seq(redirectUri),
        "code"          -> Seq(code)
      ))
      .map { response =>
        Redirect(routes.Actions.account).flashing {
          "oauth" -> Json.stringify(response.json)
        }
      }
  }

  def github = Action {
    Redirect(connectUrl)
  }

  def config(key: String): String = {
    Play.current.configuration.getString(key).getOrElse {
      sys.error(s"Missing configuration value for key: $key")
    }
  }
}
