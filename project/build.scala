import sbt._, Keys._

object build extends Build {
  val root = Project(
    id = "octohub",
    base = file("."),
    settings = Defaults.defaultSettings ++ play.Project.playScalaSettings ++ Seq(
      version              := "0.1.0",
      organization         := "ro.igstan",
      scalaVersion         := "2.10.3",
      crossPaths           := false,
      scalacOptions       ++= Seq("-feature", "-unchecked", "-deprecation"),
      javacOptions        ++= Seq("-Xlint:unchecked", "-Xlint:deprecation"),
      libraryDependencies ++= Seq()
    )
  )
}
