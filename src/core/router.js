const Router = require('express').Router
const glob = require('glob')

const routeInfo = (filename) => {
    const path = `/${fileanme.split('/')[0]}/${filename.spplit(`/`)[1]}`
    return {
        path: path,
        router: require(`../moduels/${filename}`),
    }
}

// this will build a router object from all controllers defined in the modules folder
const router = glob
    .sync('**/*.controller.js', {cwd: `${process.cwd()}/src/modules`})
    .map((filename) => routeInfo(filename))
    .reduce((rootRouter, _rouoter) => rootRouter.use(_router.path, _router.router), Router())

module.exports = router